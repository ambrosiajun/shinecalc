import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __shinePool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __shineSchemaReady: Promise<void> | undefined;
}

function getPool(): Pool {
  if (!global.__shinePool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    const local = /localhost|127\.0\.0\.1/.test(connectionString);
    global.__shinePool = new Pool({
      connectionString,
      ssl: local ? undefined : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return global.__shinePool;
}

const SEED_SHINE: [string, number][] = [
  ['브리즈번 메인코스', 800],
  ['서퍼스투어', 350],
  ['마운틴템버린', 450],
  ['론파인투어', 250],
  ['바이론베이', 500],
  ['잇스트릿', 250],
  ['옵션추가', 100],
  ['픽업-기본', 300],
  ['픽업-페리추가픽업', 400],
  ['픽업-골드코스트픽업', 500],
];

const SEED_DRIVER: [string, number][] = [
  ['호텔공항', 80],
  ['공항페리', 120],
  ['시티투어', 300],
  ['시티투어골코드랍', 330],
  ['골코픽업', 130],
  ['론파인', 180],
  ['서퍼스', 230],
  ['템버린', 230],
  ['국제선픽업', 30],
  ['한팀추가', 40],
];

async function ensureSchema() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shine_settings (
      id           INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      fixed_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS shine_prices (
      id         SERIAL PRIMARY KEY,
      category   TEXT NOT NULL CHECK (category IN ('shine', 'driver')),
      name       TEXT NOT NULL,
      price      NUMERIC(12,2) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      active     BOOLEAN NOT NULL DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS shine_history (
      id         SERIAL PRIMARY KEY,
      work_date  DATE NOT NULL,
      data       JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    INSERT INTO shine_settings (id, fixed_salary) VALUES (1, 1933.69)
    ON CONFLICT (id) DO NOTHING;
  `);

  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS n FROM shine_prices'
  );
  if (rows[0].n === 0) {
    const seed = [
      ...SEED_SHINE.map(([n, p], i) => ['shine', n, p, i] as const),
      ...SEED_DRIVER.map(([n, p], i) => ['driver', n, p, i] as const),
    ];
    for (const [cat, name, price, order] of seed) {
      await pool.query(
        'INSERT INTO shine_prices (category, name, price, sort_order) VALUES ($1, $2, $3, $4)',
        [cat, name, price, order]
      );
    }
  }
}

export async function db(): Promise<Pool> {
  if (!global.__shineSchemaReady) {
    global.__shineSchemaReady = ensureSchema().catch(err => {
      global.__shineSchemaReady = undefined;
      throw err;
    });
  }
  await global.__shineSchemaReady;
  return getPool();
}
