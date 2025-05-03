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

// Helper function to extract ID from URL
function getIdFromUrl(url: string): number | null {
  try {
    const pathSegments = new URL(url).pathname.split('/');
    const idString = pathSegments[pathSegments.length - 1];
    const id = parseInt(idString, 10);
    return isNaN(id) ? null : id;
  } catch (e) {
    return null;
  }
}

// GET: Fetch a single product by ID
export async function GET(req: NextRequest) { // Only req argument
  const id = getIdFromUrl(req.url);

  if (id === null) {
    return NextResponse.json({ message: 'Invalid or missing ID in URL' }, { status: 400 });
  }

  try {
    const product = await executeFirst<Product>('SELECT * FROM Products WHERE product_id = ?', [id]);

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT: Update an existing product
export async function PUT(req: NextRequest) { // Only req argument
  const id = getIdFromUrl(req.url);

  if (id === null) {
    return NextResponse.json({ message: 'Invalid or missing ID in URL' }, { status: 400 });
  }

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

    // Check if product exists
    const existingProduct = await executeFirst('SELECT product_id FROM Products WHERE product_id = ?', [id]);
    if (!existingProduct) {
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Check if product_code is unique if provided and changed
    if (product_code) {
        const existingCode = await executeFirst('SELECT product_id FROM Products WHERE product_code = ? AND product_id != ?', [product_code, id]);
        if (existingCode) {
            return NextResponse.json({ message: 'Product code must be unique' }, { status: 409 });
        }
    }

    const result = await executeRun(
      'UPDATE Products SET product_code = ?, product_name = ?, description = ?, unit_of_measure = ?, selling_price = ?, reorder_level = ? WHERE product_id = ?',
      [product_code || null, product_name, description || null, unit_of_measure, selling_price, reorder_level || 0, id]
    );

    // Use result.meta.changes for D1 write operations
    if (result.success && result.meta?.changes && result.meta.changes > 0) {
      return NextResponse.json({ message: 'Product updated successfully' }, { status: 200 });
    } else if (result.success && (!result.meta?.changes || result.meta.changes === 0)) {
        return NextResponse.json({ message: 'Product found but no changes were made' }, { status: 200 });
    } else {
      console.error(`Failed to update product ${id}:`, result.error || 'Unknown D1 error');
      return NextResponse.json({ message: result.error || 'Failed to update product' }, { status: 500 });
    }

  } catch (error) {
    console.error(`Product update error for ${id}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

// DELETE: Delete a product
export async function DELETE(req: NextRequest) { // Only req argument
  const id = getIdFromUrl(req.url);

  if (id === null) {
    return NextResponse.json({ message: 'Invalid or missing ID in URL' }, { status: 400 });
  }

  try {
    // Check if product exists
    const existingProduct = await executeFirst('SELECT product_id FROM Products WHERE product_id = ?', [id]);
    if (!existingProduct) {
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Add checks here if the product is used in BOMs, Sales Orders, Inventory etc. before allowing deletion

    const result = await executeRun('DELETE FROM Products WHERE product_id = ?', [id]);

    // Use result.meta.changes for D1 write operations
    if (result.success && result.meta?.changes && result.meta.changes > 0) {
      return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
    } else if (result.success && (!result.meta?.changes || result.meta.changes === 0)) {
        return NextResponse.json({ message: 'Product not found or already deleted' }, { status: 404 });
    } else {
      console.error(`Failed to delete product ${id}:`, result.error || 'Unknown D1 error');
      return NextResponse.json({ message: result.error || 'Failed to delete product (possibly due to dependencies)' }, { status: 500 });
    }

  } catch (error) {
    console.error(`Failed to delete product ${id}:`, error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

// Trigger deployment

