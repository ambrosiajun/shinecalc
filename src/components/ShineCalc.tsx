'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  History,
  LogOut,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Settings,
} from 'lucide-react';
import { calculate, money } from '@/lib/calc';
import type { Config, HistoryEntry, PriceItem } from '@/lib/types';
import HistoryPanel from './HistoryPanel';
import PriceEditor from './PriceEditor';

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export default function ShineCalc() {
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [workDate, setWorkDate] = useState(today);
  const [memo, setMemo] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, h] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/history'),
      ]);
      if (c.status === 401) return void (window.location.href = '/login');
      if (!c.ok || !h.ok) throw new Error('DB 연결 실패');
      setConfig(await c.json());
      setHistory(await h.json());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const snapshot = useMemo(
    () => (config ? calculate(config.fixedSalary, config.items, counts) : null),
    [config, counts]
  );

  const setCount = (id: number, n: number) =>
    setCounts(c => ({ ...c, [id]: Math.max(0, Math.floor(n) || 0) }));

  const save = async () => {
    if (!snapshot) return;
    setSaving(true);
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workDate,
        data: { ...snapshot, memo: memo.trim() || undefined },
      }),
    });
    setSaving(false);
    if (!res.ok) return alert('저장 실패');
    const entry: HistoryEntry = await res.json();
    setHistory(h =>
      [entry, ...h].sort(
        (a, b) => b.work_date.localeCompare(a.work_date) || b.id - a.id
      )
    );
  };

  const remove = async (id: number) => {
    if (!confirm('이 기록을 삭제할까요?')) return;
    const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
    if (res.ok) setHistory(h => h.filter(e => e.id !== id));
  };

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!config || !snapshot)
    return <div className="p-6 text-gray-400">Loading...</div>;

  const shineItems = config.items.filter(i => i.category === 'shine');
  const driverItems = config.items.filter(i => i.category === 'driver');

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 min-w-0 pb-40 lg:pb-6">
        {/* Header */}
        <header className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold mr-auto whitespace-nowrap">
            Shine Calc
          </h1>
          <input
            type="date"
            value={workDate}
            onChange={e => setWorkDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-sm min-w-0"
          />
          <button
            onClick={() => setHistoryOpen(true)}
            className="btn-ghost lg:hidden relative"
            title="History"
          >
            <History className="size-4" />
            {history.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-white text-[10px] leading-4 text-center">
                {history.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="btn-ghost"
            title="가격 / Fixed 수정"
          >
            <Settings className="size-4" />
          </button>
          <button onClick={logout} className="btn-ghost" title="로그아웃">
            <LogOut className="size-4" />
          </button>
        </header>

        {/* Fixed salary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-3 sm:px-4 py-3 flex justify-between gap-2 text-sm sm:text-base">
          <span className="text-gray-600">Fixed Salary to bank for shine</span>
          <span className="font-mono font-semibold">
            {money(config.fixedSalary)}
          </span>
        </div>

        <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
          <ItemTable
            title="Shine"
            items={shineItems}
            counts={counts}
            setCount={setCount}
            total={snapshot.shineTotal}
            totalLabel="합계"
          />
          <ItemTable
            title="Driver"
            items={driverItems}
            counts={counts}
            setCount={setCount}
            total={snapshot.driverTotal}
            totalLabel="total"
          />
        </div>

        {/* Result breakdown */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 space-y-1.5 font-mono text-sm">
          <Row label="Shine 합계" value={snapshot.shineTotal} />
          <Row label="− Fixed Salary" value={-snapshot.fixedSalary} />
          <Row label="차액" value={snapshot.diff} strong />
          <Row label="− Driver total" value={-snapshot.driverTotal} />
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-baseline">
            <span className="font-sans font-bold text-gray-700">총받을돈</span>
            <span
              className={`text-2xl font-bold ${snapshot.result < 0 ? 'text-red-600' : 'text-blue-600'}`}
            >
              {money(snapshot.result)}
            </span>
          </div>
        </section>

        {/* Save bar — sticky at the bottom on mobile, inline on desktop */}
        <div className="fixed lg:static inset-x-0 bottom-0 z-30 bg-white lg:bg-transparent border-t lg:border-0 border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:shadow-none p-3 lg:p-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-0 space-y-2">
          <div className="flex items-baseline justify-between lg:hidden pr-14">
            <span className="text-sm font-bold text-gray-700">총받을돈</span>
            <span
              className={`text-xl font-bold font-mono ${snapshot.result < 0 ? 'text-red-600' : 'text-blue-600'}`}
            >
              {money(snapshot.result)}
            </span>
          </div>
          <div className="flex gap-2 lg:pr-0 pr-14">
            <input
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="메모 (선택)"
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <button
              onClick={() => setCounts({})}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm"
              title="초기화"
            >
              <RotateCcw className="size-4" />
              <span className="hidden sm:inline">초기화</span>
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold whitespace-nowrap"
            >
              <Save className="size-4" /> {saving ? '저장중...' : '저장'}
            </button>
          </div>
        </div>
      </main>

      <HistoryPanel
        history={history}
        onDelete={remove}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

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
    </div>
  );
}

function Row({
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
      className={`flex justify-between ${strong ? 'font-semibold' : 'text-gray-600'}`}
    >
      <span className="font-sans">{label}</span>
      <span>{money(value)}</span>
    </div>
  );
}

function ItemTable(props: {
  title: string;
  items: PriceItem[];
  counts: Record<number, number>;
  setCount: (id: number, n: number) => void;
  total: number;
  totalLabel: string;
}) {
  const { title, items, counts, setCount, total, totalLabel } = props;
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="text-left font-semibold px-3 py-2">{title}</th>
            <th className="hidden sm:table-cell text-right font-normal px-2 py-2">
              가격
            </th>
            <th className="text-center font-normal px-2 py-2">횟수</th>
            <th className="text-right font-normal px-3 py-2">금액</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => {
            const c = counts[it.id] || 0;
            return (
              <tr
                key={it.id}
                className={`border-t border-gray-100 ${c ? 'bg-blue-50/60' : ''}`}
              >
                <td className="px-3 py-1.5">
                  {it.name}
                  <div className="sm:hidden text-xs text-gray-400 font-mono">
                    {money(it.price)}
                  </div>
                </td>
                <td className="hidden sm:table-cell px-2 py-1.5 text-right font-mono text-gray-500">
                  {money(it.price)}
                </td>
                <td className="px-2 py-1">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setCount(it.id, c - 1)}
                      className="size-8 sm:size-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600"
                      aria-label="minus"
                    >
                      <Minus className="size-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={c || ''}
                      onChange={e => setCount(it.id, Number(e.target.value))}
                      className="w-9 text-center border border-gray-200 rounded py-1 sm:py-0.5 font-mono text-base sm:text-sm"
                    />
                    <button
                      onClick={() => setCount(it.id, c + 1)}
                      className="size-8 sm:size-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600"
                      aria-label="plus"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right font-mono">
                  {money(it.price * c)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200 font-semibold">
            <td
              colSpan={2}
              className="sm:hidden px-3 py-2 text-right text-gray-600"
            >
              {totalLabel}
            </td>
            <td
              colSpan={3}
              className="hidden sm:table-cell px-3 py-2 text-right text-gray-600"
            >
              {totalLabel}
            </td>
            <td className="px-3 py-2 text-right font-mono">{money(total)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
