export type Category = 'shine' | 'driver';

export type PriceItem = {
  id: number;
  category: Category;
  name: string;
  price: number;
  sort_order: number;
};

export type Config = {
  fixedSalary: number;
  items: PriceItem[];
};

/** Per-item counts entered for each week. */
export type Counts = Record<number, { week1: number; week2: number }>;

export type SnapshotLine = {
  name: string;
  price: number;
  week1?: number; // absent in records saved before the week split
  week2?: number;
  count: number; // week1 + week2
  amount: number;
};

/** What gets stored in shine_history.data — a full, self-contained snapshot. */
export type Snapshot = {
  fixedSalary: number;
  shine: SnapshotLine[];
  driver: SnapshotLine[];
  shineTotal: number;
  diff: number;
  driverTotal: number;
  result: number;
  memo?: string;
};

export type HistoryEntry = {
  id: number;
  work_date: string;
  created_at: string;
  data: Snapshot;
};
