import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Config, PriceItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function readConfig(): Promise<Config> {
  const pool = await db();
  const [s, p] = await Promise.all([
    pool.query('SELECT fixed_salary FROM shine_settings WHERE id = 1'),
    pool.query(
      `SELECT id, category, name, price, sort_order FROM shine_prices
       WHERE active ORDER BY category DESC, sort_order, id`
    ),
  ]);
  return {
    fixedSalary: Number(s.rows[0]?.fixed_salary ?? 0),
    items: p.rows.map(r => ({ ...r, price: Number(r.price) })),
  };
}

export async function GET() {
  return NextResponse.json(await readConfig());
}

/** Replace fixed salary + price table. Items without an id are inserted; missing ones are deactivated. */
export async function PUT(req: Request) {
  const body = (await req.json()) as {
    fixedSalary: number;
    items: Partial<PriceItem>[];
  };
  const pool = await db();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE shine_settings SET fixed_salary = $1, updated_at = now() WHERE id = 1',
      [Number(body.fixedSalary) || 0]
    );
    const keep: number[] = [];
    for (const [i, it] of body.items.entries()) {
      const name = String(it.name ?? '').trim();
      if (!name || (it.category !== 'shine' && it.category !== 'driver'))
        continue;
      const price = Number(it.price) || 0;
      if (it.id) {
        await client.query(
          'UPDATE shine_prices SET name = $1, price = $2, sort_order = $3, category = $4 WHERE id = $5',
          [name, price, i, it.category, it.id]
        );
        keep.push(it.id);
      } else {
        const { rows } = await client.query(
          'INSERT INTO shine_prices (category, name, price, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
          [it.category, name, price, i]
        );
        keep.push(rows[0].id);
      }
    }
    await client.query(
      'UPDATE shine_prices SET active = false WHERE NOT (id = ANY($1::int[]))',
      [keep]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return NextResponse.json(await readConfig());
}
