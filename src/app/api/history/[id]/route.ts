import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const pool = await db();
  await pool.query('DELETE FROM shine_history WHERE id = $1', [
    Number(params.id),
  ]);
  return NextResponse.json({ ok: true });
}
