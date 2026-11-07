import { money } from './calc';
import type { Entry } from './types';
import { padEnd, padStart, width } from './text';

export const ENTRY_COLUMNS = `id, batch_id, category, to_char(entry_date, 'YYYY-MM-DD') AS entry_date,
  customer, item_name, price, created_at`;

export const toEntry = (r: Record<string, unknown>): Entry =>
  ({ ...r, price: Number(r.price) }) as Entry;

export const sumPrice = (es: { price: number }[]) =>
  Math.round(es.reduce((s, e) => s + (Number(e.price) || 0), 0) * 100) / 100;

type Line = Pick<Entry, 'entry_date' | 'customer' | 'item_name' | 'price'>;

/**
 * Plain-text table for pasting into chat:
 *   Shine
 *   2026-11-07  김철수  브리즈번 메인코스  800
 *   합계                                   800
 */
export function entriesText(title: string, lines: Line[], totalLabel: string) {
  const rows = lines.map(l => [
    l.entry_date,
    l.customer || '-',
    l.item_name,
    money(l.price),
  ]);
  const total = money(sumPrice(lines));
  const w = [0, 1, 2, 3].map(i =>
    Math.max(0, ...rows.map(r => width(r[i])), i === 3 ? width(total) : 0)
  );
  const lead = rows.length ? w[0] + w[1] + w[2] + 6 : width(totalLabel) + 2;
  return [
    title,
    ...rows.map(
      r =>
        `${padEnd(r[0], w[0])}  ${padEnd(r[1], w[1])}  ${padEnd(r[2], w[2])}  ${padStart(r[3], w[3])}`
    ),
    `${padEnd(totalLabel, lead)}${padStart(total, w[3])}`,
  ].join('\n');
}
