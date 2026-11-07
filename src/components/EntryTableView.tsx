import { money } from '@/lib/calc';
import { entriesText, sumPrice } from '@/lib/entries';
import type { Entry } from '@/lib/types';
import CopyButton from './CopyButton';

/** Read-only Shine / Driver table used by the history and records pages. */
export default function EntryTableView({
  title,
  entries,
  totalLabel,
  empty = '—',
}: {
  title: string;
  entries: Entry[];
  totalLabel: string;
  empty?: string;
}) {
  const total = sumPrice(entries);
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-600 text-sm">
          {title}
          <span className="ml-2 font-normal text-gray-400">
            {entries.length}건
          </span>
        </h3>
      </div>
      {entries.length === 0 ? (
        <div className="px-3 py-4 text-sm text-gray-400 text-center">
          {empty}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 text-xs">
              <tr>
                <th className="text-left font-normal px-3 py-1.5">날짜</th>
                <th className="text-left font-normal px-2 py-1.5">고객</th>
                <th className="text-left font-normal px-2 py-1.5">항목</th>
                <th className="text-right font-normal px-3 py-1.5">가격</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-t border-gray-100">
                  <td className="px-3 py-1.5 font-mono text-gray-500 whitespace-nowrap">
                    {e.entry_date}
                  </td>
                  <td className="px-2 py-1.5">{e.customer || '-'}</td>
                  <td className="px-2 py-1.5">{e.item_name}</td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    {money(e.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-end gap-3 px-3 py-2 border-t-2 border-gray-200 font-semibold text-sm">
        <CopyButton getText={() => entriesText(title, entries, totalLabel)} />
        <span className="text-gray-600">{totalLabel}</span>
        <span className="font-mono min-w-16 text-right">{money(total)}</span>
      </div>
    </section>
  );
}
