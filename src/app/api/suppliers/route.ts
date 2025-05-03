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

// GET: Fetch all suppliers
export async function GET(req: NextRequest) {
  try {
    const { results } = await executeQuery<Supplier>('SELECT * FROM Suppliers ORDER BY supplier_name');
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    return NextResponse.json({ message: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

// POST: Create a new supplier
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supplier_name, contact_person, email, phone_number, address } = body;

    // Basic validation
    if (!supplier_name) {
      return NextResponse.json({ message: 'Missing required field (supplier_name)' }, { status: 400 });
    }

    const result = await executeRun(
      'INSERT INTO Suppliers (supplier_name, contact_person, email, phone_number, address) VALUES (?, ?, ?, ?, ?)',
      [supplier_name, contact_person || null, email || null, phone_number || null, address || null]
    );

    if (result.success) {
      return NextResponse.json({ message: 'Supplier created successfully', supplierId: result.meta.last_row_id }, { status: 201 });
    } else {
      console.error('Failed to create supplier:', result);
      return NextResponse.json({ message: 'Failed to create supplier' }, { status: 500 });
    }

  } catch (error) {
    console.error('Supplier creation error:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

