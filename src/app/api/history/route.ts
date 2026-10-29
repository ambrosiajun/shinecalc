import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Snapshot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const pool = await db();
  const { rows } = await pool.query(
    `SELECT id, to_char(work_date, 'YYYY-MM-DD') AS work_date, created_at, data
     FROM shine_history ORDER BY work_date DESC, id DESC LIMIT 500`
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { workDate, data } = (await req.json()) as {
    workDate: string;
    data: Snapshot;
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate ?? '') || !data) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const pool = await db();
  const { rows } = await pool.query(
    `INSERT INTO shine_history (work_date, data) VALUES ($1, $2)
     RETURNING id, to_char(work_date, 'YYYY-MM-DD') AS work_date, created_at, data`,
    [workDate, data]
  );
  return NextResponse.json(rows[0]);
}
