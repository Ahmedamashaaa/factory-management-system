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

// GET: Fetch all raw materials
export async function GET(req: NextRequest) {
  try {
    const { results } = await executeQuery<RawMaterial>('SELECT * FROM RawMaterials ORDER BY material_name');
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch raw materials:', error);
    return NextResponse.json({ message: 'Failed to fetch raw materials' }, { status: 500 });
  }
}

// POST: Create a new raw material
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { material_code, material_name, description, unit_of_measure, reorder_level } = body;

    // Basic validation
    if (!material_name || !unit_of_measure) {
      return NextResponse.json({ message: 'Missing required fields (material_name, unit_of_measure)' }, { status: 400 });
    }

    // Check if material_code is unique if provided
    if (material_code) {
        const existing = await executeFirst('SELECT material_id FROM RawMaterials WHERE material_code = ?', [material_code]);
        if (existing) {
            return NextResponse.json({ message: 'Material code must be unique' }, { status: 409 });
        }
    }

    const result = await executeRun(
      'INSERT INTO RawMaterials (material_code, material_name, description, unit_of_measure, reorder_level) VALUES (?, ?, ?, ?, ?)',
      [material_code || null, material_name, description || null, unit_of_measure, reorder_level || 0]
    );

    if (result.success) {
      return NextResponse.json({ message: 'Raw material created successfully', materialId: result.meta.last_row_id }, { status: 201 });
    } else {
      console.error('Failed to create raw material:', result);
      return NextResponse.json({ message: 'Failed to create raw material' }, { status: 500 });
    }

  } catch (error) {
    console.error('Raw material creation error:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

