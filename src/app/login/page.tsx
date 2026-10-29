'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

const MAX_TRIES = 3;

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Browser-side only: resets on refresh.
  const [fails, setFails] = useState(0);
  const locked = fails >= MAX_TRIES;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) return void (window.location.href = '/');
    const n = fails + 1;
    setFails(n);
    setPassword('');
    setError(
      n >= MAX_TRIES
        ? `${MAX_TRIES}회 틀렸습니다. 새로고침 후 다시 시도하세요.`
        : `비밀번호가 틀렸습니다 (${n}/${MAX_TRIES})`
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xs bg-white rounded-xl shadow-lg p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Lock className="size-4" /> Shine Calc
        </div>
        <input
          type="password"
          autoFocus
          disabled={locked}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {locked && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            새로고침
          </button>
        )}
        <button
          disabled={loading || locked}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg py-2 font-semibold"
        >
          {loading ? '...' : '들어가기'}
        </button>
      </form>
    </div>
  );
}
