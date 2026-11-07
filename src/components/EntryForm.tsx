'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Save, Settings, X } from 'lucide-react';
import { money } from '@/lib/calc';
import { entriesText, sumPrice } from '@/lib/entries';
import type { Category, Config, PriceItem } from '@/lib/types';
import CopyButton from './CopyButton';
import PriceEditor from './PriceEditor';

type Row = {
  key: string;
  entry_date: string;
  customer: string;
  item_id: number | '';
  item_name: string;
  price: string;
};

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

let seq = 0;
const newRow = (entry_date = today()): Row => ({
  key: `r${++seq}`,
  entry_date,
  customer: '',
  item_id: '',
  item_name: '',
  price: '',
});

const filled = (rows: Row[]) => rows.filter(r => r.item_name);
const asLines = (rows: Row[]) =>
  filled(rows).map(r => ({ ...r, price: Number(r.price) || 0 }));

const TABLES: { category: Category; title: string; totalLabel: string }[] = [
  { category: 'shine', title: 'Shine', totalLabel: '합계' },
  { category: 'driver', title: 'Driver', totalLabel: 'total' },
];

export default function EntryForm() {
  const [config, setConfig] = useState<Config | null>(null);
  const [customers, setCustomers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<Record<Category, Row[]>>(() => ({
    shine: [newRow()],
    driver: [newRow()],
  }));
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, e] = await Promise.all([
          fetch('/api/config'),
          fetch('/api/entries?from=9999-01-01'), // just the name lists
        ]);
        if (c.status === 401) return void (window.location.href = '/login');
        if (!c.ok) throw new Error('DB 연결 실패');
        setConfig(await c.json());
        if (e.ok) setCustomers((await e.json()).customers);
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, []);

  const totals = useMemo(
    () => ({
      shine: sumPrice(asLines(rows.shine)),
      driver: sumPrice(asLines(rows.driver)),
    }),
    [rows]
  );
  const count = filled(rows.shine).length + filled(rows.driver).length;

  const save = async () => {
    const entries = TABLES.flatMap(t =>
      asLines(rows[t.category]).map(r => ({
        category: t.category,
        entry_date: r.entry_date,
        customer: r.customer,
        item_name: r.item_name,
        price: r.price,
      }))
    );
    if (!entries.length) return alert('입력된 항목이 없습니다');
    setSaving(true);
    const res = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memo, entries }),
    });
    setSaving(false);
    if (!res.ok) return alert('저장 실패');
    const { id } = await res.json();
    setSavedId(id);
    setCustomers(cs =>
      Array.from(
        new Set([...entries.map(e => e.customer).filter(Boolean), ...cs])
      )
    );
    setRows({ shine: [newRow()], driver: [newRow()] });
    setMemo('');
  };

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!config) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <main className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 pb-40 lg:pb-6 max-w-[1600px] mx-auto">
      <header className="flex items-center gap-2">
        <h1 className="text-lg font-bold mr-auto">입력</h1>
        <button
          onClick={() => setEditing(true)}
          className="btn-ghost"
          title="가격 수정"
        >
          <Settings className="size-4" />
        </button>
      </header>

      {savedId && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
          저장했습니다.
          <Link href="/history" className="underline">
            히스토리 보기
          </Link>
          <button
            onClick={() => setSavedId(null)}
            className="ml-auto"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <datalist id="customer-list">
        {customers.map(c => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2 items-start">
        {TABLES.map(t => (
          <EntryTable
            key={t.category}
            title={t.title}
            totalLabel={t.totalLabel}
            items={config.items.filter(i => i.category === t.category)}
            rows={rows[t.category]}
            total={totals[t.category]}
            onChange={next => {
              setSavedId(null);
              setRows(r => ({ ...r, [t.category]: next }));
            }}
          />
        ))}
      </div>

      {/* Save bar — sticky at the bottom on mobile, inline on desktop */}
      <div className="fixed lg:static inset-x-0 bottom-0 z-20 bg-white lg:bg-transparent border-t lg:border-0 border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:shadow-none p-3 lg:p-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-0 space-y-2">
        <div className="flex items-baseline gap-4 text-sm pr-14 lg:pr-0">
          <span className="text-gray-500">
            Shine{' '}
            <b className="font-mono text-gray-800">{money(totals.shine)}</b>
          </span>
          <span className="text-gray-500">
            Driver{' '}
            <b className="font-mono text-gray-800">{money(totals.driver)}</b>
          </span>
          <span className="ml-auto text-xs text-gray-400">{count}건</span>
        </div>
        <div className="flex gap-2 pr-14 lg:pr-0">
          <input
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="메모 (선택)"
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          <button
            onClick={save}
            disabled={saving || count === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold whitespace-nowrap"
          >
            <Save className="size-4" /> {saving ? '저장중...' : '저장'}
          </button>
        </div>
      </div>

      {editing && (
        <PriceEditor
          config={config}
          onClose={() => setEditing(false)}
          onSaved={c => {
            setConfig(c);
            setEditing(false);
          }}
        />
      )}
    </main>
  );
}

const inputCls =
  'w-full min-w-0 border border-gray-300 rounded px-2 py-1.5 text-base sm:text-sm bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300';

function EntryTable({
  title,
  totalLabel,
  items,
  rows,
  total,
  onChange,
}: {
  title: string;
  totalLabel: string;
  items: PriceItem[];
  rows: Row[];
  total: number;
  onChange: (rows: Row[]) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const focusNext = useRef<string | null>(null);

  // After adding a row, move the cursor to its customer field.
  useEffect(() => {
    if (!focusNext.current) return;
    listRef.current
      ?.querySelector<HTMLInputElement>(
        `[data-row="${focusNext.current}"] input[name=customer]`
      )
      ?.focus();
    focusNext.current = null;
  }, [rows]);

  const update = (key: string, patch: Partial<Row>) =>
    onChange(rows.map(r => (r.key === key ? { ...r, ...patch } : r)));

  const addRow = () => {
    const row = newRow(rows[rows.length - 1]?.entry_date);
    focusNext.current = row.key;
    onChange([...rows, row]);
  };

  const remove = (key: string) => {
    const next = rows.filter(r => r.key !== key);
    onChange(next.length ? next : [newRow(rows[0]?.entry_date)]);
  };

  const pickItem = (key: string, id: string) => {
    const it = items.find(i => i.id === Number(id));
    update(key, {
      item_id: it ? it.id : '',
      item_name: it?.name ?? '',
      price: it ? String(it.price) : '',
    });
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 grid grid-cols-[1fr_1fr_2rem] sm:grid-cols-[8.5rem_1fr_1.4fr_6rem_2rem] gap-1.5 text-xs text-gray-500">
        <span className="font-semibold text-sm text-gray-600">{title}</span>
        <span className="hidden sm:block self-end">고객이름</span>
        <span className="hidden sm:block self-end">항목</span>
        <span className="hidden sm:block self-end text-right">가격</span>
      </div>

      <div ref={listRef} className="divide-y divide-gray-100">
        {rows.map((r, i) => (
          <div
            key={r.key}
            data-row={r.key}
            className={[
              'grid grid-cols-[1fr_1fr_2rem] sm:grid-cols-[8.5rem_1fr_1.4fr_6rem_2rem] gap-1.5 items-center px-3 py-2',
              r.item_name ? 'bg-blue-50/50' : '',
              'focus-within:bg-amber-100 focus-within:shadow-[inset_4px_0_0_#f59e0b]',
            ].join(' ')}
          >
            <input
              type="date"
              value={r.entry_date}
              onChange={e => update(r.key, { entry_date: e.target.value })}
              className={`${inputCls} order-1`}
              aria-label="날짜"
            />
            <input
              name="customer"
              list="customer-list"
              value={r.customer}
              onChange={e => update(r.key, { customer: e.target.value })}
              placeholder="고객이름"
              className={`${inputCls} order-2`}
            />
            <button
              type="button"
              onClick={() => remove(r.key)}
              className="order-3 sm:order-5 p-1 text-gray-300 hover:text-red-500 justify-self-center"
              aria-label="행 삭제"
            >
              <X className="size-4" />
            </button>
            <select
              value={r.item_id}
              onChange={e => pickItem(r.key, e.target.value)}
              className={`${inputCls} order-4 sm:order-3 ${r.item_id ? '' : 'text-gray-400'}`}
              aria-label="항목"
            >
              <option value="">항목 선택</option>
              {items.map(it => (
                <option key={it.id} value={it.id} className="text-gray-900">
                  {it.name} ({money(it.price)})
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="decimal"
              value={r.price}
              onChange={e => update(r.key, { price: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter' && i === rows.length - 1) {
                  e.preventDefault();
                  addRow();
                }
              }}
              placeholder="가격"
              className={`${inputCls} order-5 sm:order-4 text-right font-mono`}
              aria-label="가격"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 px-3 py-2 border-t-2 border-gray-200 text-sm">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 text-blue-600 hover:underline mr-auto"
        >
          <Plus className="size-4" /> 행 추가
        </button>
        <CopyButton
          getText={() => entriesText(title, asLines(rows), totalLabel)}
        />
        <span className="font-semibold text-gray-600">{totalLabel}</span>
        <span className="font-mono font-semibold min-w-16 text-right">
          {money(total)}
        </span>
      </div>
    </section>
  );
}
