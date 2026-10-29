import type { Counts, PriceItem, Snapshot, SnapshotLine } from './types';

export const round2 = (n: number) => Math.round(n * 100) / 100;

const lines = (items: PriceItem[], counts: Counts): SnapshotLine[] =>
  items.map(it => {
    const { week1 = 0, week2 = 0 } = counts[it.id] ?? {};
    const count = week1 + week2;
    return {
      name: it.name,
      price: it.price,
      week1,
      week2,
      count,
      amount: round2(it.price * count),
    };
  });

const sum = (ls: SnapshotLine[]) =>
  round2(ls.reduce((s, l) => s + l.amount, 0));

/**
 * 합계(shine) − Fixed Salary = 차액
 * 차액 − Driver total = 총받을돈
 */
export function calculate(
  fixedSalary: number,
  items: PriceItem[],
  counts: Counts
): Snapshot {
  const shine = lines(
    items.filter(i => i.category === 'shine'),
    counts
  );
  const driver = lines(
    items.filter(i => i.category === 'driver'),
    counts
  );
  const shineTotal = sum(shine);
  const driverTotal = sum(driver);
  const diff = round2(shineTotal - fixedSalary);
  return {
    fixedSalary,
    shine,
    driver,
    shineTotal,
    diff,
    driverTotal,
    result: round2(diff - driverTotal),
  };
}

export const money = (n: number) =>
  n.toLocaleString('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
