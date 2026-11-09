'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { money } from '@/lib/calc';
import { sumPrice } from '@/lib/entries';
import type { Batch } from '@/lib/types';
import EntryTableView from './EntryTableView';

/** One card per save ("batch"), each showing its Shine and Driver lines. */
export default function BatchHistory() {
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/batches')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('DB 연결 실패'))))
      .then((bs: Batch[]) => {
        setBatches(bs);
        if (bs[0]) setOpen(new Set([bs[0].id]));
      })
      .catch(e => setError(e.message));
  }, []);

  const toggle = (id: number) =>
    setOpen(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!batches) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <main className="p-3 sm:p-4 lg:p-6 space-y-3 max-w-6xl mx-auto pb-24">
      <h1 className="text-lg font-bold">
        히스토리
        <span className="ml-2 text-sm font-normal text-gray-400">
          저장 단위 · {batches.length}건
        </span>
      </h1>

      {batches.length === 0 && (
        <p className="text-gray-400 text-sm py-8 text-center">
          저장된 기록이 없습니다
        </p>
      )}

      {batches.map(b => {
        const shine = b.entries.filter(e => e.category === 'shine');
        const driver = b.entries.filter(e => e.category === 'driver');
        const dates = Array.from(
          new Set(b.entries.map(e => e.entry_date))
        ).sort();
        const isOpen = open.has(b.id);
        return (
          <article
            key={b.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => toggle(b.id)}
              className="w-full flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-gray-50"
            >
              {isOpen ? (
                <ChevronDown className="size-4 text-gray-400" />
              ) : (
                <ChevronRight className="size-4 text-gray-400" />
              )}
              <span className="text-sm">
                {new Date(b.created_at).toLocaleString('ko-KR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {dates.length > 1
                  ? `${dates[0]} ~ ${dates[dates.length - 1]}`
                  : dates[0]}
              </span>
              {b.memo && (
                <span className="text-xs text-gray-500 truncate max-w-48">
                  {b.memo}
                </span>
              )}
              <span className="ml-auto text-sm text-gray-500 flex gap-4">
                <span>
                  Shine{' '}
                  <b className="font-mono text-gray-800">
                    {money(sumPrice(shine))}
                  </b>
                </span>
                <span>
                  Driver{' '}
                  <b className="font-mono text-gray-800">
                    {money(sumPrice(driver))}
                  </b>
                </span>
              </span>
            </button>

            {isOpen && (
              <div className="px-3 sm:px-4 pb-4 space-y-3">
                <div className="grid gap-3 lg:grid-cols-2 items-start">
                  <EntryTableView
                    title="Shine"
                    entries={shine}
                    totalLabel="합계"
                  />
                  <EntryTableView
                    title="Driver"
                    entries={driver}
                    totalLabel="total"
                  />
                </div>
              </div>
            )}
          </article>
        );
      })}
    </main>
  );
}
