import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeRun, executeFirst } from '@/lib/db';

// Define the structure for Product
interface Product {
  product_id: number;
  product_code: string | null;
  product_name: string;
  description: string | null;
  unit_of_measure: string;
  selling_price: number;
  reorder_level: number;
  created_at: string;
}

// GET: Fetch all products
export async function GET(req: NextRequest) {
  try {
    const { results } = await executeQuery<Product>('SELECT * FROM Products ORDER BY product_name');
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ message: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST: Create a new product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_code, product_name, description, unit_of_measure, selling_price, reorder_level } = body;

    // Basic validation
    if (!product_name || !unit_of_measure || selling_price === undefined || selling_price === null) {
      return NextResponse.json({ message: 'Missing required fields (product_name, unit_of_measure, selling_price)' }, { status: 400 });
    }
    if (typeof selling_price !== 'number' || selling_price < 0) {
        return NextResponse.json({ message: 'Invalid selling price' }, { status: 400 });
    }

    // Check if product_code is unique if provided
    if (product_code) {
        const existing = await executeFirst('SELECT product_id FROM Products WHERE product_code = ?', [product_code]);
        if (existing) {
            return NextResponse.json({ message: 'Product code must be unique' }, { status: 409 });
        }
    }

    const result = await executeRun(
      'INSERT INTO Products (product_code, product_name, description, unit_of_measure, selling_price, reorder_level) VALUES (?, ?, ?, ?, ?, ?)',
      [product_code || null, product_name, description || null, unit_of_measure, selling_price, reorder_level || 0]
    );

    if (result.success) {
      return NextResponse.json({ message: 'Product created successfully', productId: result.meta.last_row_id }, { status: 201 });
    } else {
      console.error('Failed to create product:', result);
      return NextResponse.json({ message: 'Failed to create product' }, { status: 500 });
    }

  } catch (error) {
    console.error('Product creation error:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

