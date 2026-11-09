'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const RECENT = 15; // shown while the field is empty
const MATCHES = 20; // shown while typing

/**
 * Customer name field with suggestions: the 15 most recent customers when
 * empty, otherwise any known customer whose name contains what was typed.
 * `customers` is ordered most recent first.
 */
export default function CustomerInput({
  value,
  onChange,
  customers,
  className,
  name,
}: {
  value: string;
  onChange: (v: string) => void;
  customers: string[];
  className?: string;
  name?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const q = value.trim().toLowerCase();
  const options = q
    ? customers
        .filter(c => c.toLowerCase().includes(q) && c.toLowerCase() !== q)
        .slice(0, MATCHES)
    : customers.slice(0, RECENT);
  const show = open && options.length > 0;

  // The tables clip overflow, so the list is positioned against the viewport.
  useLayoutEffect(() => {
    if (!show) return;
    const place = () =>
      setRect(inputRef.current?.getBoundingClientRect() ?? null);
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [show]);

  useEffect(() => setActive(-1), [q]);

  const pick = (c: string) => {
    onChange(c);
    setOpen(false);
  };

  return (
    <>
      <input
        ref={inputRef}
        name={name}
        value={value}
        autoComplete="off"
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={e => {
          if (!show) {
            if (e.key === 'ArrowDown') setOpen(true);
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(i => Math.min(i + 1, options.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(i => Math.max(i - 1, -1));
          } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault();
            pick(options[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        placeholder="고객이름"
        className={className}
        role="combobox"
        aria-expanded={show}
        aria-autocomplete="list"
      />
      {show && rect && (
        <ul
          role="listbox"
          className="fixed z-50 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl py-1 text-sm"
          style={{
            top: rect.bottom + 4,
            left: rect.left,
            width: Math.max(rect.width, 160),
          }}
        >
          {!q && (
            <li className="px-3 py-1 text-[11px] text-gray-400 select-none">
              최근 고객
            </li>
          )}
          {options.map((c, i) => (
            <li
              key={c}
              role="option"
              aria-selected={i === active}
              // mousedown keeps focus in the input so blur doesn't close first
              onMouseDown={e => {
                e.preventDefault();
                pick(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-1.5 cursor-pointer ${i === active ? 'bg-amber-100' : ''}`}
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
