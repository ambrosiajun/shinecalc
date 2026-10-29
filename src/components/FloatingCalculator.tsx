'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, X, Delete, Copy, Check } from 'lucide-react';

// ── Safe math helpers ─────────────────────────────────────────────────────────
function applyOp(a: number, b: number, op: string): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      if (b === 0) throw new Error('÷0');
      return a / b;
    default:
      return b;
  }
}

function fmt(n: number): string {
  if (!isFinite(n)) return 'Error';
  // avoid floating-point noise (e.g. 0.1+0.2)
  return parseFloat(n.toPrecision(12)).toString();
}

// ── State ─────────────────────────────────────────────────────────────────────
type CalcState = {
  display: string; // big display value
  stored: number | null;
  op: string | null; // pending operator: +/-/*/÷
  resetNext: boolean;
  history: string; // small expression line
};

const INIT: CalcState = {
  display: '0',
  stored: null,
  op: null,
  resetNext: false,
  history: '',
};

// ── Button grid ───────────────────────────────────────────────────────────────
//  Display chars → internal ops mapped via OP_MAP below
const BTNS = [
  ['C', '%', '⌫', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['+/−', '0', '.', '='],
];

const OP_MAP: Record<string, string> = { '÷': '/', '×': '*', '−': '-' };

// ── Component ─────────────────────────────────────────────────────────────────
export default function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [calc, setCalc] = useState<CalcState>(INIT);
  const [copied, setCopied] = useState(false);

  // ── actions ─────────────────────────────────────────────────────────────────
  const digit = useCallback((d: string) => {
    setCalc(s => {
      if (s.display === 'Error') return { ...s, display: d, resetNext: false };
      if (s.resetNext) return { ...s, display: d, resetNext: false };
      if (s.display.length >= 15) return s;
      return { ...s, display: s.display === '0' ? d : s.display + d };
    });
  }, []);

  const dot = useCallback(() => {
    setCalc(s => {
      if (s.display === 'Error')
        return { ...s, display: '0.', resetNext: false };
      const base = s.resetNext ? '0' : s.display;
      if (base.includes('.')) return { ...s, resetNext: false };
      return { ...s, display: base + '.', resetNext: false };
    });
  }, []);

  const pressOp = useCallback((operator: string) => {
    setCalc(s => {
      if (s.display === 'Error') return INIT;
      const cur = parseFloat(s.display);
      if (s.op !== null && !s.resetNext) {
        try {
          const result = applyOp(s.stored!, cur, s.op);
          return {
            display: fmt(result),
            stored: result,
            op: operator,
            resetNext: true,
            history: `${fmt(result)} ${operator} `,
          };
        } catch {
          return { ...INIT, display: 'Error' };
        }
      }
      return {
        ...s,
        stored: cur,
        op: operator,
        resetNext: true,
        history: `${s.display} ${operator} `,
      };
    });
  }, []);

  const equals = useCallback(() => {
    setCalc(s => {
      if (s.display === 'Error') return INIT;
      if (s.op === null || s.stored === null)
        return { ...s, history: `${s.display} =` };
      const cur = parseFloat(s.display);
      try {
        const result = applyOp(s.stored, cur, s.op);
        return {
          display: fmt(result),
          stored: null,
          op: null,
          resetNext: true,
          history: `${s.history}${s.display} =`,
        };
      } catch {
        return { ...INIT, display: 'Error' };
      }
    });
  }, []);

  const percent = useCallback(() => {
    setCalc(s => {
      if (s.display === 'Error') return s;
      return {
        ...s,
        display: fmt(parseFloat(s.display) / 100),
        resetNext: false,
      };
    });
  }, []);

  const toggleSign = useCallback(() => {
    setCalc(s => {
      if (s.display === '0' || s.display === 'Error') return s;
      return {
        ...s,
        display: s.display.startsWith('-')
          ? s.display.slice(1)
          : '-' + s.display,
      };
    });
  }, []);

  const backspace = useCallback(() => {
    setCalc(s => {
      if (s.resetNext || s.display === 'Error') return s;
      return {
        ...s,
        display: s.display.length <= 1 ? '0' : s.display.slice(0, -1),
      };
    });
  }, []);

  const clear = useCallback(() => setCalc(INIT), []);

  const copyResult = useCallback(async () => {
    if (calc.display === 'Error') return;
    try {
      await navigator.clipboard.writeText(calc.display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [calc.display]);

  // Click on display → paste number from clipboard
  const pasteValue = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.trim().replace(/,/g, '');
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        setCalc(s => ({
          ...s,
          display: cleaned.replace(/[^0-9.\-]/g, ''),
          resetNext: false,
        }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ── keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        digit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        dot();
      } else if (e.key === '+') {
        e.preventDefault();
        pressOp('+');
      } else if (e.key === '-') {
        e.preventDefault();
        pressOp('-');
      } else if (e.key === '*') {
        e.preventDefault();
        pressOp('*');
      } else if (e.key === '/') {
        e.preventDefault();
        pressOp('/');
      } else if (e.key === '%') {
        e.preventDefault();
        percent();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        equals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key === 'Delete' || e.key === 'Escape') {
        e.preventDefault();
        if (e.key === 'Escape') setOpen(false);
        else clear();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, digit, dot, pressOp, percent, equals, backspace, clear]);

  // ── button handler ───────────────────────────────────────────────────────────
  const handleBtn = (btn: string) => {
    const op = OP_MAP[btn] ?? btn;
    switch (op) {
      case 'C':
        clear();
        break;
      case '%':
        percent();
        break;
      case '⌫':
        backspace();
        break;
      case '+/−':
        toggleSign();
        break;
      case '.':
        dot();
        break;
      case '=':
        equals();
        break;
      case '+':
      case '-':
      case '*':
      case '/':
        pressOp(op);
        break;
      default:
        digit(op);
        break;
    }
  };

  // ── styles ───────────────────────────────────────────────────────────────────
  const btnCls = (btn: string) => {
    const base =
      'flex items-center justify-center rounded-lg text-sm font-semibold h-10 transition-all duration-75 cursor-pointer select-none active:scale-95';
    if (btn === '=') return `${base} bg-blue-500 hover:bg-blue-600 text-white`;
    if (['÷', '×', '−', '+'].includes(btn))
      return `${base} bg-amber-400 hover:bg-amber-500 text-white`;
    if (btn === 'C') return `${base} bg-red-400 hover:bg-red-500 text-white`;
    return `${base} bg-gray-100 hover:bg-gray-200 text-gray-800`;
  };

  const dlen = calc.display.replace(/[-.]/, '').length;
  const dSize = dlen > 13 ? 'text-base' : dlen > 9 ? 'text-xl' : 'text-2xl';

  return (
    <div>
      {/* ── Toggle tab ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={[
          'fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 lg:bottom-4 lg:right-4 z-40',
          'flex items-center justify-center w-11 h-11',
          'rounded-full border shadow-lg transition-colors',
          open
            ? 'bg-blue-500 text-white border-blue-600'
            : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200',
        ].join(' ')}
        title={open ? 'Close calculator (Esc)' : 'Open calculator'}
        aria-label="Toggle calculator"
      >
        <Calculator className="size-5" />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          className="fixed z-40 w-[260px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            bottom: 'calc(4.25rem + env(safe-area-inset-bottom))',
            right: '0.75rem',
            maxWidth: 'calc(100vw - 1.5rem)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">
              Calculator
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={copyResult}
                className={[
                  'p-1 rounded transition-colors',
                  copied
                    ? 'text-green-500'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200',
                ].join(' ')}
                title="Copy result"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Close (Esc)"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Display */}
          <div className="px-4 py-3 bg-gray-900 select-text">
            {/* Expression history */}
            <div className="text-right text-gray-500 text-xs h-4 truncate font-mono">
              {calc.history || '\u00A0'}
            </div>
            {/* Main display — click to paste */}
            <div
              className={`text-right text-white font-mono ${dSize} mt-1 truncate cursor-pointer`}
              onClick={pasteValue}
              title="Click to paste from clipboard"
            >
              {calc.display}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-1.5 p-3 bg-gray-50">
            {BTNS.flat().map((btn, i) => (
              <button
                key={i}
                type="button"
                // onMouseDown prevents focus stealing from other inputs
                onMouseDown={e => {
                  e.preventDefault();
                  handleBtn(btn);
                }}
                className={btnCls(btn)}
              >
                {btn === '⌫' ? <Delete className="size-4" /> : btn}
              </button>
            ))}
          </div>

          {/* Hint */}
          <div className="px-3 py-1.5 text-[10px] text-gray-400 bg-gray-50 border-t border-gray-100 text-center select-none">
            Click display to paste · Ctrl+C to copy selection
          </div>
        </div>
      )}
    </div>
  );
}
