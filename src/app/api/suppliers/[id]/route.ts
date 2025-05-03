import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeRun, executeFirst } from '@/lib/db';

// Define the structure for Supplier
interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person: string | null;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  created_at: string;
}

// GET: Fetch a single supplier by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const supplier = await executeFirst<Supplier>('SELECT * FROM Suppliers WHERE supplier_id = ?', [id]);

    if (!supplier) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch supplier ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch supplier' }, { status: 500 });
  }
}

// PUT: Update an existing supplier
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const body = await req.json();
    const { supplier_name, contact_person, email, phone_number, address } = body;

    // Basic validation
    if (!supplier_name) {
      return NextResponse.json({ message: 'Missing required field (supplier_name)' }, { status: 400 });
    }

    // Check if supplier exists
    const existingSupplier = await executeFirst('SELECT supplier_id FROM Suppliers WHERE supplier_id = ?', [id]);
    if (!existingSupplier) {
        return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    const result = await executeRun(
      'UPDATE Suppliers SET supplier_name = ?, contact_person = ?, email = ?, phone_number = ?, address = ? WHERE supplier_id = ?',
      [supplier_name, contact_person || null, email || null, phone_number || null, address || null, id]
    );

    if (result.success && result.meta.rows_written > 0) {
      return NextResponse.json({ message: 'Supplier updated successfully' }, { status: 200 });
    } else if (result.success && result.meta.rows_written === 0) {
        return NextResponse.json({ message: 'Supplier update did not affect any rows' }, { status: 200 });
    } else {
      console.error(`Failed to update supplier ${id}:`, result);
      return NextResponse.json({ message: 'Failed to update supplier' }, { status: 500 });
    }

  } catch (error) {
    console.error(`Supplier update error for ${params.id}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

// DELETE: Delete a supplier
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    // Check if supplier exists
    const existingSupplier = await executeFirst('SELECT supplier_id FROM Suppliers WHERE supplier_id = ?', [id]);
    if (!existingSupplier) {
        return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    // Add checks here if the supplier is linked to Purchase Orders or MaterialSuppliers before allowing deletion
    // For now, we proceed with deletion.

    // First, delete links in MaterialSuppliers (optional, depends on desired behavior)
    // await executeRun('DELETE FROM MaterialSuppliers WHERE supplier_id = ?', [id]);

    const result = await executeRun('DELETE FROM Suppliers WHERE supplier_id = ?', [id]);

    if (result.success && result.meta.rows_written > 0) {
      return NextResponse.json({ message: 'Supplier deleted successfully' }, { status: 200 });
    } else if (result.success && result.meta.rows_written === 0) {
        return NextResponse.json({ message: 'Supplier not found or already deleted' }, { status: 404 });
    } else {
      console.error(`Failed to delete supplier ${id}:`, result);
      // Check for foreign key constraint errors if applicable
      return NextResponse.json({ message: 'Failed to delete supplier (possibly due to dependencies)' }, { status: 500 });
    }

  } catch (error) {
    console.error(`Failed to delete supplier ${params.id}:`, error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

