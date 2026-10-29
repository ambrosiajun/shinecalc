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

export type SnapshotLine = {
  name: string;
  price: number;
  count: number;
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
