import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BackofficeMenu from './BackofficeMenu';
import SidebarLayout from './SidebarLayout';
import CurrentUser from './CurrentUser';
import { clearBackofficeSession } from '../lib/auth';

interface BackofficeLayoutProps {
  children: React.ReactNode;
  activeRoute: string;
  title?: string;
}

function getStoredRole(): string {
  if (typeof window === 'undefined') return 'admin';
  const stored = localStorage.getItem('backoffice_role');
  if (stored) return stored;
  try {
    const token = localStorage.getItem('backoffice_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || 'admin';
    }
  } catch {}
  return 'admin';
}

export default function BackofficeLayout({ children, activeRoute, title = 'Backoffice | Kioske Digital' }: BackofficeLayoutProps) {
  const router = useRouter();
  const [userNome, setUserNome] = useState('Maria Silva');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('admin');
  const [mesaSelecionada, setMesaSelecionada] = useState('01');

  useEffect(() => {
    const nome = localStorage.getItem('backoffice_nome');
    const avatar = localStorage.getItem('backoffice_avatar');
    const mesa = localStorage.getItem('backoffice_mesa');

    if (nome) setUserNome(nome);
    if (avatar) setUserAvatar(avatar);
    if (mesa) setMesaSelecionada(mesa);
    setUserRole(getStoredRole());
  }, []);

  const handleLogout = () => {
    clearBackofficeSession();
    router.push('/login');
  };

  const sidebar = (
    <>
      <div className="p-6">
        <h1 className="text-lg font-bold text-brand">Backoffice Terminal</h1>
        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Driving School Admin</p>
      </div>
      <BackofficeMenu activeRoute={activeRoute} role={userRole} />
      <CurrentUser
        className="p-6 border-t border-gray-100"
        nome={userNome}
        subtitle={userRole === 'admin' ? 'Admin' : 'Rececionista'}
        avatar={userAvatar}
        onLogout={handleLogout}
      />
    </>
  );

  const topbar = (
    <>
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-brand border-r border-gray-300 pr-4">KIOSKE DIGITAL UNIVERSAL</h2>
        <span className="text-gray-600 font-medium">{userRole === 'admin' ? 'Painel da Administração' : 'Painel da Rececionista'}</span>
        {(activeRoute === '/' || activeRoute === '/fila') && (
          <select
            value={mesaSelecionada}
            onChange={(e) => {
              setMesaSelecionada(e.target.value);
              localStorage.setItem('backoffice_mesa', e.target.value);
            }}
            className="ml-4 border border-gray-200 rounded-lg p-2 text-sm text-brand font-bold bg-green-50 focus:outline-none"
          >
            <option value="01">Mesa 01</option>
            <option value="02">Mesa 02</option>
            <option value="03">Mesa 03</option>
            <option value="04">Mesa 04</option>
          </select>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span> ONLINE
        </span>
      </div>
    </>
  );

  return (
    <SidebarLayout title={title} sidebar={sidebar} topbar={topbar}>
      {children}
    </SidebarLayout>
  );
}
