'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { Category, Config, PriceItem } from '@/lib/types';

type Draft = Omit<PriceItem, 'id' | 'sort_order'> & {
  id?: number;
  key: string;
};

let seq = 0;
const key = () => `k${++seq}`;

export default function PriceEditor({
  config,
  onClose,
  onSaved,
}: {
  config: Config;
  onClose: () => void;
  onSaved: (c: Config) => void;
}) {
  const [fixed, setFixed] = useState(String(config.fixedSalary));
  const [items, setItems] = useState<Draft[]>(() =>
    config.items.map(i => ({
      id: i.id,
      category: i.category,
      name: i.name,
      price: i.price,
      key: key(),
    }))
  );
  const [saving, setSaving] = useState(false);

  const update = (k: string, patch: Partial<Draft>) =>
    setItems(list => list.map(i => (i.key === k ? { ...i, ...patch } : i)));

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fixedSalary: Number(fixed) || 0,
        items: items.map(({ id, category, name, price }) => ({
          id,
          category,
          name,
          price,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) return alert('저장 실패');
    onSaved(await res.json());
  };

  const section = (cat: Category, title: string) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <button
          onClick={() =>
            setItems(l => [
              ...l,
              { category: cat, name: '', price: 0, key: key() },
            ])
          }
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <Plus className="size-3" /> 추가
        </button>
      </div>
      <div className="space-y-1">
        {items
          .filter(i => i.category === cat)
          .map(i => (
            <div key={i.key} className="flex gap-1">
              <input
                value={i.name}
                onChange={e => update(i.key, { name: e.target.value })}
                className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <input
                type="number"
                value={i.price}
                onChange={e => update(i.key, { price: Number(e.target.value) })}
                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right font-mono"
              />
              <button
                onClick={() => setItems(l => l.filter(x => x.key !== i.key))}
                className="px-1.5 text-gray-400 hover:text-red-500"
                aria-label="delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold">가격 / Fixed Salary 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          <label className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              Fixed Salary to bank for shine
            </span>
            <input
              type="number"
              step="0.01"
              value={fixed}
              onChange={e => setFixed(e.target.value)}
              className="w-32 border border-gray-300 rounded px-2 py-1 text-right font-mono"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            {section('shine', 'Shine')}
            {section('driver', 'Driver')}
          </div>
          <p className="text-xs text-gray-400">
            저장된 히스토리는 저장 당시의 가격 / Fixed 값을 그대로 보관하므로
            여기서 바꿔도 영향을 받지 않습니다.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold"
          >
            {saving ? '저장중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
