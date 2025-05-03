import { NextRequest, NextResponse } from 'next/server';
import { executeRun, executeFirst } from '@/lib/db';

// Define structure for receiving stock
interface StockReceiptBody {
  item_type: 'RawMaterial' | 'Product';
  item_id: number;
  quantity_received: number;
  entry_date?: string; // Optional, defaults to CURRENT_TIMESTAMP
  expiry_date?: string; // Optional
  purchase_order_detail_id?: number; // Link to PO for raw materials
  production_order_id?: number; // Link to Production Order for finished goods
  cost_per_unit?: number;
  location_id?: number; // Optional, if using multiple locations
  user_id: number; // User performing the action
  notes?: string;
}

// POST: Record a stock receipt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as StockReceiptBody;
    const {
      item_type,
      item_id,
      quantity_received,
      entry_date,
      expiry_date,
      purchase_order_detail_id,
      production_order_id,
      cost_per_unit,
      location_id,
      user_id,
      notes
    } = body;

    // Basic validation
    if (!item_type || !item_id || !quantity_received || quantity_received <= 0 || !user_id) {
      return NextResponse.json({ message: 'Missing required fields (item_type, item_id, quantity_received, user_id) or invalid quantity' }, { status: 400 });
    }
    if (item_type !== 'RawMaterial' && item_type !== 'Product') {
        return NextResponse.json({ message: 'Invalid item_type' }, { status: 400 });
    }

    // Further validation: Check if item_id exists in RawMaterials or Products table
    const itemCheckQuery = item_type === 'RawMaterial' 
        ? 'SELECT material_id FROM RawMaterials WHERE material_id = ?'
        : 'SELECT product_id FROM Products WHERE product_id = ?';
    const itemExists = await executeFirst(itemCheckQuery, [item_id]);
    if (!itemExists) {
        return NextResponse.json({ message: `${item_type} with ID ${item_id} not found` }, { status: 404 });
    }

    // TODO: Add validation for location_id, user_id, purchase_order_detail_id, production_order_id if provided

    // 1. Create a new Inventory Lot
    const lotResult = await executeRun(
      `INSERT INTO InventoryLots 
       (item_type, item_id, location_id, quantity_received, current_quantity, entry_date, expiry_date, purchase_order_detail_id, production_order_id, cost_per_unit) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        item_type, 
        item_id, 
        location_id || null, 
        quantity_received, 
        quantity_received, // Initially, current_quantity equals quantity_received
        entry_date || new Date().toISOString(), // Use provided date or now
        expiry_date || null, 
        purchase_order_detail_id || null, 
        production_order_id || null, 
        cost_per_unit || null
      ]
    );

    if (!lotResult.success) {
      console.error('Failed to create inventory lot:', lotResult);
      return NextResponse.json({ message: 'Failed to create inventory lot' }, { status: 500 });
    }

    const newLotId = lotResult.meta.last_row_id;

    // 2. Record the Stock Movement
    const movementResult = await executeRun(
      `INSERT INTO StockMovements 
       (item_type, item_id, lot_id, movement_type, quantity, movement_date, related_document_type, related_document_id, user_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        item_type, 
        item_id, 
        newLotId, 
        'Receipt', // Movement type
        quantity_received, // Positive quantity for receipt
        new Date().toISOString(), // Movement date is always now
        purchase_order_detail_id ? 'PurchaseOrder' : (production_order_id ? 'ProductionOrder' : null),
        purchase_order_detail_id || production_order_id || null,
        user_id,
        notes || `Received ${quantity_received} units of ${item_type} ID ${item_id}`
      ]
    );

    if (!movementResult.success) {
      // Ideally, should implement rollback logic here if movement fails after lot creation
      console.error('Failed to record stock movement after creating lot:', movementResult);
      // Attempt to delete the created lot? Or flag it?
      return NextResponse.json({ message: 'Failed to record stock movement' }, { status: 500 });
    }

    // TODO: Update PurchaseOrderDetail received_quantity if applicable

    return NextResponse.json({ message: 'Stock received successfully', lotId: newLotId }, { status: 201 });

  } catch (error) {
    console.error('Stock receipt error:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

