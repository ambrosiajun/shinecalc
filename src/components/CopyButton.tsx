'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Copies the text returned by `getText` and briefly shows "Copied". */
export default function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('복사 실패');
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={[
        'flex items-center gap-1 px-2 py-1 rounded border text-xs font-normal whitespace-nowrap',
        copied
          ? 'border-green-300 text-green-600 bg-green-50'
          : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50',
      ].join(' ')}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copied' : 'Copy to text'}
    </button>
  );
}
