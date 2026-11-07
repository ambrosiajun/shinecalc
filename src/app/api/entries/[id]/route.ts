import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ENTRY_COLUMNS, toEntry } from '@/lib/entries';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const b = await req.json();
  const item = String(b.item_name ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.entry_date ?? '') || !item) {
    return NextResponse.json(
      { error: '날짜와 항목은 필수입니다' },
      { status: 400 }
    );
  }
  const pool = await db();
  const { rows } = await pool.query(
    `UPDATE shine_entries
     SET entry_date = $1, customer = $2, item_name = $3, price = $4
     WHERE id = $5
     RETURNING ${ENTRY_COLUMNS}`,
    [
      b.entry_date,
      String(b.customer ?? '').trim(),
      item,
      Number(b.price) || 0,
      Number(params.id),
    ]
  );
  if (!rows[0])
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(toEntry(rows[0]));
}

/** Deletes one line; a batch left with no lines is removed too. */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const pool = await db();
  const { rows } = await pool.query(
    'DELETE FROM shine_entries WHERE id = $1 RETURNING batch_id',
    [Number(params.id)]
  );
  if (rows[0]) {
    await pool.query(
      `DELETE FROM shine_batches b WHERE id = $1
       AND NOT EXISTS (SELECT 1 FROM shine_entries e WHERE e.batch_id = b.id)`,
      [rows[0].batch_id]
    );
  }
  return NextResponse.json({ ok: true });
}
