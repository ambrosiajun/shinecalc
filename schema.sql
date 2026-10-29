-- shinecalc schema (also created automatically on first request)

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

-- Each saved calculation keeps its own snapshot of fixed salary + prices,
-- so later price changes never alter past results.
CREATE TABLE IF NOT EXISTS shine_history (
  id         SERIAL PRIMARY KEY,
  work_date  DATE NOT NULL,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
