import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ENTRY_COLUMNS, toEntry } from '@/lib/entries';
import type { Batch, Entry } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const pool = await db();
  const b = await pool.query(
    'SELECT id, memo, created_at FROM shine_batches ORDER BY id DESC LIMIT 300'
  );
  const ids = b.rows.map(r => r.id);
  const e = ids.length
    ? await pool.query(
        `SELECT ${ENTRY_COLUMNS} FROM shine_entries
         WHERE batch_id = ANY($1::int[]) ORDER BY sort_order, id`,
        [ids]
      )
    : { rows: [] };
  const byBatch = new Map<number, Entry[]>();
  for (const r of e.rows) {
    const entry = toEntry(r);
    byBatch.set(entry.batch_id, [
      ...(byBatch.get(entry.batch_id) ?? []),
      entry,
    ]);
  }
  const batches: Batch[] = b.rows.map(r => ({
    ...r,
    entries: byBatch.get(r.id) ?? [],
  }));
  return NextResponse.json(batches);
}

type NewEntry = Pick<
  Entry,
  'category' | 'entry_date' | 'customer' | 'item_name' | 'price'
>;

export async function POST(req: Request) {
  const body = (await req.json()) as { memo?: string; entries: NewEntry[] };
  const entries = (body.entries ?? []).filter(
    e =>
      (e.category === 'shine' || e.category === 'driver') &&
      /^\d{4}-\d{2}-\d{2}$/.test(e.entry_date ?? '') &&
      String(e.item_name ?? '').trim()
  );
  if (!entries.length) {
    return NextResponse.json(
      { error: '저장할 항목이 없습니다' },
      { status: 400 }
    );
  }

  const pool = await db();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO shine_batches (memo) VALUES ($1) RETURNING id',
      [body.memo?.trim() || null]
    );
    const batchId = rows[0].id;
    for (const [i, e] of entries.entries()) {
      await client.query(
        `INSERT INTO shine_entries
           (batch_id, category, entry_date, customer, item_name, price, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          batchId,
          e.category,
          e.entry_date,
          String(e.customer ?? '').trim(),
          String(e.item_name).trim(),
          Number(e.price) || 0,
          i,
        ]
      );
    }
    await client.query('COMMIT');
    return NextResponse.json({ id: batchId });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
