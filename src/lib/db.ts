import { getCloudflareContext } from '@cloudflare/next/dist/framework/cloudflare';

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

export async function getDB() {
  const { env } = getCloudflareContext();
  return env.DB;
}

export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<D1Result<T>> {
  const db = await getDB();
  return await db.prepare(query).bind(...params).all<T>();
}

export async function executeRun(
  query: string, 
  params: any[] = []
): Promise<D1Result> {
  const db = await getDB();
  return await db.prepare(query).bind(...params).run();
}

export async function executeFirst<T = any>(
  query: string, 
  params: any[] = []
): Promise<T | null> {
  const db = await getDB();
  const result = await db.prepare(query).bind(...params).first<T>();
  return result || null;
}
