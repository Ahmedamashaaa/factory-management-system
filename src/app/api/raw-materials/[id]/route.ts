import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeRun, executeFirst } from '@/lib/db';

// Define the structure for RawMaterial
interface RawMaterial {
  material_id: number;
  material_code: string | null;
  material_name: string;
  description: string | null;
  unit_of_measure: string;
  reorder_level: number;
  created_at: string;
}

// GET: Fetch a single raw material by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const material = await executeFirst<RawMaterial>('SELECT * FROM RawMaterials WHERE material_id = ?', [id]);

    if (!material) {
      return NextResponse.json({ message: 'Raw material not found' }, { status: 404 });
    }

    return NextResponse.json(material, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch raw material ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch raw material' }, { status: 500 });
  }
}

// PUT: Update an existing raw material
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const body = await req.json();
    const { material_code, material_name, description, unit_of_measure, reorder_level } = body;

    // Basic validation
    if (!material_name || !unit_of_measure) {
      return NextResponse.json({ message: 'Missing required fields (material_name, unit_of_measure)' }, { status: 400 });
    }

    // Check if material exists
    const existingMaterial = await executeFirst('SELECT material_id FROM RawMaterials WHERE material_id = ?', [id]);
    if (!existingMaterial) {
        return NextResponse.json({ message: 'Raw material not found' }, { status: 404 });
    }

    // Check if material_code is unique if provided and changed
    if (material_code) {
        const existingCode = await executeFirst('SELECT material_id FROM RawMaterials WHERE material_code = ? AND material_id != ?', [material_code, id]);
        if (existingCode) {
            return NextResponse.json({ message: 'Material code must be unique' }, { status: 409 });
        }
    }

    const result = await executeRun(
      'UPDATE RawMaterials SET material_code = ?, material_name = ?, description = ?, unit_of_measure = ?, reorder_level = ? WHERE material_id = ?',
      [material_code || null, material_name, description || null, unit_of_measure, reorder_level || 0, id]
    );

    if (result.success && result.meta.rows_written > 0) {
      return NextResponse.json({ message: 'Raw material updated successfully' }, { status: 200 });
    } else if (result.success && result.meta.rows_written === 0) {
        // This case might happen if the update didn't change any data or the ID was wrong, but we already checked existence.
        return NextResponse.json({ message: 'Raw material update did not affect any rows' }, { status: 200 });
    } else {
      console.error(`Failed to update raw material ${id}:`, result);
      return NextResponse.json({ message: 'Failed to update raw material' }, { status: 500 });
    }

  } catch (error) {
    console.error(`Raw material update error for ${params.id}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

// DELETE: Delete a raw material
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    // Check if material exists
    const existingMaterial = await executeFirst('SELECT material_id FROM RawMaterials WHERE material_id = ?', [id]);
    if (!existingMaterial) {
        return NextResponse.json({ message: 'Raw material not found' }, { status: 404 });
    }

    // Add checks here if the raw material is used in BOMs, Purchase Orders, Inventory etc. before allowing deletion
    // For now, we proceed with deletion.

    const result = await executeRun('DELETE FROM RawMaterials WHERE material_id = ?', [id]);

    if (result.success && result.meta.rows_written > 0) {
      return NextResponse.json({ message: 'Raw material deleted successfully' }, { status: 200 });
    } else if (result.success && result.meta.rows_written === 0) {
        return NextResponse.json({ message: 'Raw material not found or already deleted' }, { status: 404 });
    } else {
      console.error(`Failed to delete raw material ${id}:`, result);
      // Check for foreign key constraint errors if applicable
      return NextResponse.json({ message: 'Failed to delete raw material (possibly due to dependencies)' }, { status: 500 });
    }

  } catch (error) {
    console.error(`Failed to delete raw material ${params.id}:`, error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

