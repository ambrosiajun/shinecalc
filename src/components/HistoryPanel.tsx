'use client';

import { useState } from 'react';
import {
  Braces,
  ChevronDown,
  ChevronRight,
  History,
  Trash2,
  X,
} from 'lucide-react';
import { money } from '@/lib/calc';
import type { HistoryEntry, SnapshotLine } from '@/lib/types';

export default function HistoryPanel({
  history,
  onDelete,
  open: drawerOpen,
  onClose,
}: {
  history: HistoryEntry[];
  onDelete: (id: number) => void;
  /** Mobile drawer state; on lg+ the panel is always shown on the side. */
  open: boolean;
  onClose: () => void;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [jsonId, setJsonId] = useState<number | null>(null);

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={[
          'bg-white flex flex-col border-gray-200',
          'fixed inset-y-0 right-0 z-50 w-[88vw] max-w-sm shadow-2xl transition-transform duration-200',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
          'lg:static lg:translate-x-0 lg:w-96 lg:max-w-none lg:shrink-0 lg:shadow-none lg:border-l lg:h-screen lg:sticky lg:top-0',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 font-semibold text-gray-700">
          <History className="size-4" /> History
          <span className="ml-auto text-xs font-normal text-gray-400">
            {history.length}건
          </span>
          <button
            onClick={onClose}
            className="lg:hidden p-1 -mr-1 text-gray-400"
            aria-label="close"
          >
            <X className="size-5" />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-gray-100 pb-20 overscroll-contain">
          {history.length === 0 && (
            <li className="px-4 py-6 text-sm text-gray-400 text-center">
              저장된 기록이 없습니다
            </li>
          )}
          {history.map(h => {
            const open = openId === h.id;
            const d = h.data;
            return (
              <li key={h.id}>
                <button
                  onClick={() => setOpenId(open ? null : h.id)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
                >
                  {open ? (
                    <ChevronDown className="size-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="size-4 text-gray-400" />
                  )}
                  <span className="font-mono text-sm">{h.work_date}</span>
                  {d.memo && (
                    <span className="text-xs text-gray-400 truncate">
                      {d.memo}
                    </span>
                  )}
                  <span
                    className={`ml-auto font-mono font-semibold ${d.result < 0 ? 'text-red-600' : 'text-blue-600'}`}
                  >
                    {money(d.result)}
                  </span>
                </button>

                {open && (
                  <div className="px-4 pb-3 text-xs space-y-2">
                    <div className="font-mono space-y-0.5 bg-gray-50 rounded-lg p-2">
                      <Line label="Fixed Salary" value={d.fixedSalary} />
                      <Line label="Shine 합계" value={d.shineTotal} />
                      <Line label="차액" value={d.diff} />
                      <Line label="Driver total" value={d.driverTotal} />
                      <Line label="총받을돈" value={d.result} strong />
                    </div>
                    <Lines title="Shine" lines={d.shine} />
                    <Lines title="Driver" lines={d.driver} />
                    <div className="text-gray-400">
                      저장: {new Date(h.created_at).toLocaleString('ko-KR')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setJsonId(jsonId === h.id ? null : h.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
                      >
                        <Braces className="size-3" /> JSON
                      </button>
                      <button
                        onClick={() => onDelete(h.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 ml-auto"
                      >
                        <Trash2 className="size-3" /> 삭제
                      </button>
                    </div>
                    {jsonId === h.id && (
                      <pre className="bg-gray-900 text-gray-100 rounded-lg p-2 overflow-x-auto text-[11px] max-h-80">
                        {JSON.stringify({ date: h.work_date, ...d }, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}

function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${strong ? 'font-bold text-gray-800' : 'text-gray-600'}`}
    >
      <span className="font-sans">{label}</span>
      <span>{money(value)}</span>
    </div>
  );
}

function Lines({ title, lines }: { title: string; lines: SnapshotLine[] }) {
  const used = lines.filter(l => l.count > 0);
  return (
    <div>
      <div className="font-semibold text-gray-500 mb-0.5">{title}</div>
      {used.length === 0 ? (
        <div className="text-gray-400">—</div>
      ) : (
        <table className="w-full font-mono">
          <tbody>
            {used.map((l, i) => (
              <tr key={i}>
                <td className="font-sans">{l.name}</td>
                <td className="text-right text-gray-400">
                  {money(l.price)} × {l.count}
                </td>
                <td className="text-right w-16">{money(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
