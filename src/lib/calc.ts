import type { PriceItem, Snapshot, SnapshotLine } from './types';

export const round2 = (n: number) => Math.round(n * 100) / 100;

const lines = (
  items: PriceItem[],
  counts: Record<number, number>
): SnapshotLine[] =>
  items.map(it => {
    const count = counts[it.id] || 0;
    return {
      name: it.name,
      price: it.price,
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
  counts: Record<number, number>
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
