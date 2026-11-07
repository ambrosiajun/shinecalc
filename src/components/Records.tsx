'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import type { Category, Entry } from '@/lib/types';
import EntryTableView from './EntryTableView';

type Filters = { from: string; to: string; item: string; customer: string };
const EMPTY: Filters = { from: '', to: '', item: '', customer: '' };

/** Every saved line, regardless of which save it came from, with filters. */
export default function Records() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [items, setItems] = useState<
    { category: Category; item_name: string }[]
  >([]);
  const [error, setError] = useState('');

  // Debounce so typing a customer name doesn't fire a request per key.
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v.trim())
      );
      const res = await fetch(`/api/entries?${q}`);
      if (!res.ok) return setError('DB 연결 실패');
      const data = await res.json();
      setEntries(data.entries);
      setItems(data.items);
    }, 250);
    return () => clearTimeout(t);
  }, [filters]);

  const set = (patch: Partial<Filters>) =>
    setFilters(f => ({ ...f, ...patch }));
  const field =
    'border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-base sm:text-sm min-w-0';

  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <main className="p-3 sm:p-4 lg:p-6 space-y-3 max-w-6xl mx-auto pb-24">
      <h1 className="text-lg font-bold">전체 내역</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 grid gap-2 grid-cols-2 sm:grid-cols-[auto_auto_1fr_1fr_auto] items-center">
        <input
          type="date"
          value={filters.from}
          onChange={e => set({ from: e.target.value })}
          className={field}
          aria-label="시작일"
          title="시작일"
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => set({ to: e.target.value })}
          className={field}
          aria-label="종료일"
          title="종료일"
        />
        <select
          value={filters.item}
          onChange={e => set({ item: e.target.value })}
          className={`${field} col-span-2 sm:col-span-1`}
          aria-label="항목"
        >
          <option value="">전체 항목</option>
          {(['shine', 'driver'] as const).map(cat => (
            <optgroup key={cat} label={cat === 'shine' ? 'Shine' : 'Driver'}>
              {items
                .filter(i => i.category === cat)
                .map(i => (
                  <option key={i.item_name} value={i.item_name}>
                    {i.item_name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <label className={`${field} flex items-center gap-1.5`}>
          <Search className="size-4 text-gray-400 shrink-0" />
          <input
            value={filters.customer}
            onChange={e => set({ customer: e.target.value })}
            placeholder="고객이름 검색"
            className="outline-none min-w-0 w-full"
          />
        </label>
        <button
          onClick={() => setFilters(EMPTY)}
          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
        >
          <RotateCcw className="size-3.5" /> 초기화
        </button>
      </div>

      {!entries ? (
        <div className="p-6 text-gray-400">Loading...</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 items-start">
          <EntryTableView
            title="Shine"
            entries={entries.filter(e => e.category === 'shine')}
            totalLabel="합계"
            empty="조건에 맞는 내역이 없습니다"
          />
          <EntryTableView
            title="Driver"
            entries={entries.filter(e => e.category === 'driver')}
            totalLabel="total"
            empty="조건에 맞는 내역이 없습니다"
          />
        </div>
      )}
    </main>
  );
}
