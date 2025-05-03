import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// Define the structure for Inventory Summary
interface InventorySummaryItem {
  item_id: number;
  item_type: string; // 'RawMaterial' or 'Product'
  item_code: string | null;
  item_name: string;
  unit_of_measure: string;
  total_quantity: number;
  reorder_level: number;
  locations: string | null; // Comma-separated list of locations if applicable
}

// GET: Fetch summarized inventory status
export async function GET(req: NextRequest) {
  try {
    // This query joins InventoryLots with RawMaterials and Products to get names and codes,
    // groups by item, sums the current_quantity, and lists locations.
    const query = `
      SELECT
        il.item_id,
        il.item_type,
        CASE
          WHEN il.item_type = 'RawMaterial' THEN rm.material_code
          WHEN il.item_type = 'Product' THEN p.product_code
          ELSE NULL
        END AS item_code,
        CASE
          WHEN il.item_type = 'RawMaterial' THEN rm.material_name
          WHEN il.item_type = 'Product' THEN p.product_name
          ELSE 'Unknown Item'
        END AS item_name,
        CASE
          WHEN il.item_type = 'RawMaterial' THEN rm.unit_of_measure
          WHEN il.item_type = 'Product' THEN p.unit_of_measure
          ELSE 'N/A'
        END AS unit_of_measure,
        SUM(il.current_quantity) AS total_quantity,
        CASE
          WHEN il.item_type = 'RawMaterial' THEN rm.reorder_level
          WHEN il.item_type = 'Product' THEN p.reorder_level
          ELSE 0
        END AS reorder_level,
        GROUP_CONCAT(DISTINCT sl.location_code) AS locations
      FROM InventoryLots il
      LEFT JOIN RawMaterials rm ON il.item_type = 'RawMaterial' AND il.item_id = rm.material_id
      LEFT JOIN Products p ON il.item_type = 'Product' AND il.item_id = p.product_id
      LEFT JOIN StorageLocations sl ON il.location_id = sl.location_id
      WHERE il.current_quantity > 0
      GROUP BY il.item_id, il.item_type
      ORDER BY item_name;
    `;

    const { results } = await executeQuery<InventorySummaryItem>(query);

    // Convert total_quantity and reorder_level back to numbers if they are strings
    const formattedResults = results.map(item => ({
        ...item,
        total_quantity: Number(item.total_quantity),
        reorder_level: Number(item.reorder_level)
    }));

    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch inventory summary:', error);
    return NextResponse.json({ message: 'Failed to fetch inventory summary' }, { status: 500 });
  }
}

