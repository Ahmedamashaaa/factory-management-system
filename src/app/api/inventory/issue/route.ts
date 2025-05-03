import { NextRequest, NextResponse } from 'next/server';
import { executeRun, executeQuery, executeFirst } from '@/lib/db';

// Define structure for issuing stock
interface StockIssueBody {
  item_type: 'RawMaterial' | 'Product';
  item_id: number;
  quantity_to_issue: number;
  issue_date?: string; // Optional, defaults to now
  related_document_type?: 'ProductionOrder' | 'SalesOrder' | 'Adjustment';
  related_document_id?: number;
  user_id: number; // User performing the action
  notes?: string;
}

// Define structure for Inventory Lot
interface InventoryLot {
    lot_id: number;
    current_quantity: number;
    entry_date: string;
}

// POST: Record a stock issue (consumption/dispatch)
// This endpoint assumes FIFO logic for consumption
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as StockIssueBody;
    const {
      item_type,
      item_id,
      quantity_to_issue,
      issue_date, // Not currently used in logic, movement_date is always now
      related_document_type,
      related_document_id,
      user_id,
      notes
    } = body;

    // Basic validation
    if (!item_type || !item_id || !quantity_to_issue || quantity_to_issue <= 0 || !user_id) {
      return NextResponse.json({ message: 'Missing required fields (item_type, item_id, quantity_to_issue, user_id) or invalid quantity' }, { status: 400 });
    }
    if (item_type !== 'RawMaterial' && item_type !== 'Product') {
        return NextResponse.json({ message: 'Invalid item_type' }, { status: 400 });
    }

    // Check total available quantity for the item
    const totalAvailableResult = await executeFirst<{ total_quantity: number }>( 
        'SELECT SUM(current_quantity) as total_quantity FROM InventoryLots WHERE item_type = ? AND item_id = ? AND current_quantity > 0',
        [item_type, item_id]
    );
    const totalAvailable = totalAvailableResult?.total_quantity || 0;

    if (totalAvailable < quantity_to_issue) {
        return NextResponse.json({ message: `Insufficient stock for ${item_type} ID ${item_id}. Available: ${totalAvailable}, Required: ${quantity_to_issue}` }, { status: 400 });
    }

    // Fetch available lots ordered by entry_date (FIFO)
    const { results: availableLots } = await executeQuery<InventoryLot>(
        'SELECT lot_id, current_quantity, entry_date FROM InventoryLots WHERE item_type = ? AND item_id = ? AND current_quantity > 0 ORDER BY entry_date ASC',
        [item_type, item_id]
    );

    let quantityRemainingToIssue = quantity_to_issue;
    const movementsToRecord: any[] = [];
    const lotsToUpdate: { lot_id: number; new_quantity: number }[] = [];

    // Iterate through lots based on FIFO and consume stock
    for (const lot of availableLots) {
        if (quantityRemainingToIssue <= 0) break;

        const quantityToConsumeFromLot = Math.min(lot.current_quantity, quantityRemainingToIssue);
        const newLotQuantity = lot.current_quantity - quantityToConsumeFromLot;

        lotsToUpdate.push({ lot_id: lot.lot_id, new_quantity: newLotQuantity });
        movementsToRecord.push([
            item_type,
            item_id,
            lot.lot_id,
            'Issue', // Movement type
            -quantityToConsumeFromLot, // Negative quantity for issue
            new Date().toISOString(), // Movement date is always now
            related_document_type || null,
            related_document_id || null,
            user_id,
            notes || `Issued ${quantityToConsumeFromLot} units for ${related_document_type || 'reason unknown'}`
        ]);

        quantityRemainingToIssue -= quantityToConsumeFromLot;
    }

    // --- Database Transaction Simulation (D1 doesn't support transactions directly via wrangler execute) ---
    // In a real scenario with transaction support, wrap these updates in a transaction.
    // Here, we execute them sequentially and hope for the best, or implement compensating actions on failure.

    try {
        // 1. Update Inventory Lot quantities
        for (const update of lotsToUpdate) {
            const updateResult = await executeRun(
                'UPDATE InventoryLots SET current_quantity = ? WHERE lot_id = ?',
                [update.new_quantity, update.lot_id]
            );
            if (!updateResult.success || updateResult.meta.rows_written === 0) {
                throw new Error(`Failed to update lot ${update.lot_id}`);
            }
        }

        // 2. Record Stock Movements
        for (const movementParams of movementsToRecord) {
            const movementResult = await executeRun(
                `INSERT INTO StockMovements 
                 (item_type, item_id, lot_id, movement_type, quantity, movement_date, related_document_type, related_document_id, user_id, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                movementParams
            );
            if (!movementResult.success) {
                // Rollback simulation: Try to revert lot updates? Very complex without transactions.
                throw new Error('Failed to record stock movement after updating lots.');
            }
        }

        // TODO: Trigger notification check if stock falls below reorder level

        return NextResponse.json({ message: 'Stock issued successfully' }, { status: 200 });

    } catch (dbError) {
        console.error('Database update failed during stock issue:', dbError);
        // Attempt to compensate? Or just report error?
        return NextResponse.json({ message: 'Failed to update database during stock issue. Potential data inconsistency.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Stock issue error:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

