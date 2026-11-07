'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

const LINKS = [
  { href: '/', label: '입력' },
  { href: '/history', label: '히스토리' },
  { href: '/records', label: '전체 내역' },
  { href: '/old-page', label: 'Old page' },
];

export default function Nav() {
  const path = usePathname();

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <nav className="sticky top-0 z-30 h-12 bg-white border-b border-gray-200 flex items-center gap-1 px-2 sm:px-4">
      <span className="hidden sm:inline font-bold mr-3 whitespace-nowrap">
        Shine Calc
      </span>
      <div className="flex gap-1 overflow-x-auto min-w-0">
        {LINKS.map(l => {
          const active =
            l.href === '/' ? path === '/' : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={[
                'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap',
                active
                  ? 'bg-blue-500 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100',
              ].join(' ')}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={logout}
        className="ml-auto p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        title="로그아웃"
        aria-label="로그아웃"
      >
        <LogOut className="size-4" />
      </button>
    </nav>
  );
}
