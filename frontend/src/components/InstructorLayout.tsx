import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

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
    localStorage.removeItem('backoffice_token');
    localStorage.removeItem('backoffice_nome');
    localStorage.removeItem('backoffice_escola');
    localStorage.removeItem('backoffice_avatar');
    localStorage.removeItem('backoffice_mesa');
    localStorage.removeItem('backoffice_role');
    router.push('/login');
  };

  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans">
      <Head><title>{title}</title></Head>

      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6">
          <h1 className="text-lg font-bold text-[#047857]">Instrutor</h1>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Portal do Instrutor</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/instructor/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              isActive('/instructor/dashboard') ? 'bg-green-50 text-[#047857] font-bold border-r-4 border-[#047857]' : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </Link>
          <Link href="/instructor/aulas"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              isActive('/instructor/aulas') ? 'bg-green-50 text-[#047857] font-bold border-r-4 border-[#047857]' : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
            </svg>
            Minhas Aulas
          </Link>
        </nav>

        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#047857] rounded-full flex items-center justify-center text-white font-bold uppercase">
              {userNome.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{userNome}</p>
              <p className="text-xs text-gray-500">Instrutor</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-left text-sm text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
            Terminar Sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-[#047857]">KIOSKE DIGITAL UNIVERSAL</h2>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> ONLINE
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
