// src/lib/db.ts

// Assume 'process.env.DB' provides the D1 binding in the Cloudflare Pages environment.
// We access it directly when needed.

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB: D1Database;
      JWT_SECRET: string;
    }
  }
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: {
    duration?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
    changes?: number;
  };
  error?: string;
}

function getDB(): D1Database {
  if (!process.env.DB) {
    throw new Error("D1 Database binding 'DB' not found in environment.");
  }
  return process.env.DB;
}

export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<D1Result<T>> {
  try {
    const db = getDB();
    const statement = db.prepare(query).bind(...params);
    const data = await statement.all<T>();
    return { 
      results: data.results,
      success: data.success,
      meta: data.meta
    };
  } catch (e: any) {
    console.error("D1 executeQuery Error:", e);
    return { success: false, error: e.message };
  }
}

export async function executeRun(
  query: string,
  params: any[] = []
): Promise<D1Result> {
  try {
    const db = getDB();
    const statement = db.prepare(query).bind(...params);
    const data = await statement.run();
     return { 
      success: data.success,
      meta: data.meta
    };
  } catch (e: any) {
    console.error("D1 executeRun Error:", e);
    return { success: false, error: e.message };
  }
}

export async function executeFirst<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const db = getDB();
    const statement = db.prepare(query).bind(...params);
    // Use .first() which returns the object directly or null
    const result = await statement.first<T>(); 
    return result;
  } catch (e: any) {
    console.error("D1 executeFirst Error:", e);
    return null;
  }
}

