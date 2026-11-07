'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { money } from '@/lib/calc';
import { entriesText, sumPrice } from '@/lib/entries';
import type { Entry, PriceItem } from '@/lib/types';
import CopyButton from './CopyButton';

type Draft = Pick<Entry, 'entry_date' | 'customer' | 'item_name'> & {
  price: string;
};

/**
 * Shine / Driver table used by the history and records pages.
 * Rows get edit / delete buttons when `onSave` / `onDelete` are given.
 */
export default function EntryTableView({
  title,
  entries,
  totalLabel,
  empty = '—',
  priceItems = [],
  onSave,
  onDelete,
}: {
  title: string;
  entries: Entry[];
  totalLabel: string;
  empty?: string;
  /** Item suggestions while editing; picking one fills in its price. */
  priceItems?: PriceItem[];
  onSave?: (id: number, draft: Draft) => Promise<boolean>;
  onDelete?: (id: number) => Promise<void>;
}) {
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const editable = !!(onSave || onDelete);
  const total = sumPrice(entries);
  const listId = `items-${title}`;

  const startEdit = (e: Entry) => {
    setEditId(e.id);
    setDraft({
      entry_date: e.entry_date,
      customer: e.customer,
      item_name: e.item_name,
      price: String(e.price),
    });
  };
  const cancel = () => {
    setEditId(null);
    setDraft(null);
  };
  const save = async () => {
    if (!onSave || editId === null || !draft) return;
    setBusy(true);
    const ok = await onSave(editId, draft);
    setBusy(false);
    if (ok) cancel();
  };
  const remove = async (e: Entry) => {
    if (!onDelete) return;
    if (
      !confirm(`${e.entry_date} ${e.customer || ''} ${e.item_name} 삭제할까요?`)
    )
      return;
    await onDelete(e.id);
  };

  const field =
    'w-full min-w-0 border border-gray-300 rounded px-2 py-1 text-base sm:text-sm bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300';

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
      {onSave && (
        <datalist id={listId}>
          {priceItems.map(it => (
            <option key={it.id} value={it.name} />
          ))}
        </datalist>
      )}
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
                {editable && <th className="w-16" />}
              </tr>
            </thead>
            <tbody>
              {entries.map(e =>
                editId === e.id && draft ? (
                  <tr
                    key={e.id}
                    className="border-t border-gray-100 bg-amber-50 shadow-[inset_4px_0_0_#f59e0b]"
                  >
                    <td colSpan={5} className="px-3 py-2">
                      <form
                        onSubmit={ev => {
                          ev.preventDefault();
                          save();
                        }}
                        onKeyDown={ev => ev.key === 'Escape' && cancel()}
                        className="grid gap-1.5 grid-cols-2 items-center"
                      >
                        <input
                          type="date"
                          required
                          value={draft.entry_date}
                          onChange={ev =>
                            setDraft({ ...draft, entry_date: ev.target.value })
                          }
                          className={field}
                          aria-label="날짜"
                        />
                        <input
                          value={draft.customer}
                          onChange={ev =>
                            setDraft({ ...draft, customer: ev.target.value })
                          }
                          placeholder="고객이름"
                          className={field}
                        />
                        <input
                          required
                          list={listId}
                          value={draft.item_name}
                          onChange={ev => {
                            const name = ev.target.value;
                            const it = priceItems.find(i => i.name === name);
                            setDraft({
                              ...draft,
                              item_name: name,
                              price: it ? String(it.price) : draft.price,
                            });
                          }}
                          placeholder="항목"
                          className={field}
                          aria-label="항목"
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          value={draft.price}
                          onChange={ev =>
                            setDraft({ ...draft, price: ev.target.value })
                          }
                          className={`${field} text-right font-mono`}
                          aria-label="가격"
                        />
                        <div className="flex gap-1 col-span-2 justify-end">
                          <button
                            type="submit"
                            disabled={busy}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs"
                          >
                            <Check className="size-3.5" /> 저장
                          </button>
                          <button
                            type="button"
                            onClick={cancel}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-gray-300 text-gray-600 text-xs bg-white"
                          >
                            <X className="size-3.5" /> 취소
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={e.id} className="border-t border-gray-100 group">
                    <td className="px-3 py-1.5 font-mono text-gray-500 whitespace-nowrap">
                      {e.entry_date}
                    </td>
                    <td className="px-2 py-1.5">{e.customer || '-'}</td>
                    <td className="px-2 py-1.5">{e.item_name}</td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {money(e.price)}
                    </td>
                    {editable && (
                      <td className="pr-2 py-1 whitespace-nowrap text-right">
                        {onSave && (
                          <button
                            onClick={() => startEdit(e)}
                            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            title="수정"
                            aria-label="수정"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => remove(e)}
                            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                            title="삭제"
                            aria-label="삭제"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              )}
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
