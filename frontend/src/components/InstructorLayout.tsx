import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SidebarLayout from './SidebarLayout';
import CurrentUser from './CurrentUser';
import { clearBackofficeSession } from '../lib/auth';

interface InstructorLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function InstructorLayout({ children, title = 'Instrutor | Kioske Digital' }: InstructorLayoutProps) {
  const router = useRouter();
  const [userNome, setUserNome] = useState('Instrutor');

  useEffect(() => {
    const nome = localStorage.getItem('backoffice_nome');
    if (nome) setUserNome(nome);
  }, []);

  const handleLogout = () => {
    clearBackofficeSession();
    router.push('/login');
  };

  const isActive = (path: string) => router.pathname === path;

  const sidebar = (
    <>
      <div className="p-6">
        <h1 className="text-lg font-bold text-brand">Instrutor</h1>
        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Portal do Instrutor</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/instrutor/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
            isActive('/instructor/dashboard') ? 'bg-green-50 text-brand font-bold border-r-4 border-brand' : 'text-gray-600 hover:bg-gray-50'
          }`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </Link>
        <Link href="/instrutor/aulas"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
            isActive('/instructor/aulas') ? 'bg-green-50 text-brand font-bold border-r-4 border-brand' : 'text-gray-600 hover:bg-gray-50'
          }`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
          </svg>
          Minhas Aulas
        </Link>
      </nav>

      <CurrentUser
        className="p-6 border-t border-gray-100"
        nome={userNome}
        subtitle="Instrutor"
        onLogout={handleLogout}
      />
    </>
  );

  const topbar = (
    <>
      <h2 className="text-lg font-bold text-brand">KIOSKE DIGITAL UNIVERSAL</h2>
      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500"></span> ONLINE
      </span>
    </>
  );

  return (
    <SidebarLayout title={title} sidebar={sidebar} topbar={topbar}>
      {children}
    </SidebarLayout>
  );
}
