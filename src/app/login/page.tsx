'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) window.location.href = '/';
    else setError((await res.json().catch(() => ({}))).error ?? '로그인 실패');
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
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg py-2 font-semibold"
        >
          {loading ? '...' : '들어가기'}
        </button>
      </form>
    </div>
  );
}
