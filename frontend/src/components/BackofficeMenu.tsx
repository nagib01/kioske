import Link from 'next/link';
import React from 'react';

type MenuItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  id: string;
};

const menuItems: MenuItem[] = [
  {
    href: '/',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    label: 'Painel',
    id: '/'
  },
  {
    href: '/fila',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: 'Fila ao Vivo',
    id: '/fila'
  },
  {
    href: '/alunos',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    label: 'Alunos',
    id: '/alunos'
  },
  {
    href: '/funcionarios',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M6 21v-2a4 4 0 0 1 4-4" />
        <circle cx="9" cy="7" r="4" />
        <circle cx="16" cy="5" r="3" />
      </svg>
    ),
    label: 'Funcionários',
    id: '/funcionarios'
  },
  {
    href: '/aulas',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
      </svg>
    ),
    label: 'Aulas',
    id: '/aulas'
  },
  {
    href: '/viaturas',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17h14M5 17a2 2 0 0 1-2-2V9l3-3h12l3 3v6a2 2 0 0 1-2 2" />
        <circle cx="7" cy="15" r="2" />
        <circle cx="17" cy="15" r="2" />
      </svg>
    ),
    label: 'Viaturas',
    id: '/viaturas'
  },
  {
    href: '/servicos',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    label: 'Serviços',
    id: '/servicos'
  },
  {
    href: '/questionarios',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    label: 'Questionários',
    id: '/questionarios'
  },
  {
    href: '/audit_logs',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    label: 'Auditoria',
    id: '/audit_logs'
  }
];

const roleAllowed: Record<string, string[]> = {
  admin: menuItems.map(m => m.id),
  recepcionista: ['/', '/fila'],
};

interface BackofficeMenuProps {
  activeRoute: string;
  role?: string;
}

export default function BackofficeMenu({ activeRoute, role = 'admin' }: BackofficeMenuProps) {
  const allowed = roleAllowed[role] || roleAllowed.admin;
  return (
    <nav className="flex-1 px-4 space-y-2 mt-4">
      {menuItems.filter(item => allowed.includes(item.id)).map((item) => {
        const isActive = activeRoute === item.id || activeRoute.startsWith(item.id + '/');

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              isActive
                ? 'bg-green-50 text-brand font-bold border-r-4 border-brand'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{item.icon}</span> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}