import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ENTRY_COLUMNS, toEntry } from '@/lib/entries';

export const dynamic = 'force-dynamic';

const isDate = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

/**
 * Every entry regardless of batch.
 * ?from=YYYY-MM-DD&to=YYYY-MM-DD&item=<exact name>&customer=<substring>
 * Also returns the item / customer names used so far, for the filter controls
 * and the entry form's suggestions.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const where: string[] = [];
  const args: unknown[] = [];
  const add = (sql: string, v: unknown) => {
    args.push(v);
    where.push(sql.replace('?', `$${args.length}`));
  };
  if (isDate(q.get('from'))) add('entry_date >= ?', q.get('from'));
  if (isDate(q.get('to'))) add('entry_date <= ?', q.get('to'));
  if (q.get('item')) add('item_name = ?', q.get('item'));
  const customer = q.get('customer')?.trim();
  if (customer) add('customer ILIKE ?', `%${customer}%`);

  const pool = await db();
  const [rows, items, customers] = await Promise.all([
    pool.query(
      `SELECT ${ENTRY_COLUMNS} FROM shine_entries
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY entry_date DESC, batch_id DESC, sort_order, id LIMIT 2000`,
      args
    ),
    pool.query(
      'SELECT DISTINCT category, item_name FROM shine_entries ORDER BY item_name'
    ),
    pool.query(
      `SELECT customer FROM shine_entries WHERE customer <> ''
       GROUP BY customer ORDER BY MAX(id) DESC LIMIT 500`
    ),
  ]);
  return NextResponse.json({
    entries: rows.rows.map(toEntry),
    items: items.rows,
    customers: customers.rows.map(r => r.customer),
  });
}
