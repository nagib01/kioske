import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BackofficeMenu from './BackofficeMenu';

interface BackofficeLayoutProps {
  children: React.ReactNode;
  activeRoute: string;
  title?: string;
}

export default function BackofficeLayout({ children, activeRoute, title = 'Backoffice | Kioske Digital' }: BackofficeLayoutProps) {
  const router = useRouter();
  const [userNome, setUserNome] = useState('Maria Silva');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [mesaSelecionada, setMesaSelecionada] = useState('01');

  useEffect(() => {
    const nome = localStorage.getItem('backoffice_nome');
    const avatar = localStorage.getItem('backoffice_avatar');
    const mesa = localStorage.getItem('backoffice_mesa');
    
    if (nome) setUserNome(nome);
    if (avatar) setUserAvatar(avatar);
    if (mesa) setMesaSelecionada(mesa);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('backoffice_token');
    localStorage.removeItem('backoffice_nome');
    localStorage.removeItem('backoffice_escola');
    localStorage.removeItem('backoffice_avatar');
    localStorage.removeItem('backoffice_mesa');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans">
      <Head>
        <title>{title}</title>
      </Head>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6">
          <h1 className="text-lg font-bold text-[#047857]">Backoffice Terminal</h1>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Driving School Admin</p>
        </div>
        <BackofficeMenu activeRoute={activeRoute} />
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            {userAvatar ? (
              <img src={userAvatar} alt={userNome} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 bg-[#047857] rounded-full flex items-center justify-center text-white font-bold uppercase">
                {userNome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-800">{userNome}</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-left text-sm text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
            Terminar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-[#047857] border-r border-gray-300 pr-4">KIOSKE DIGITAL UNIVERSAL</h2>
            <span className="text-gray-600 font-medium">Painel da Administração</span>
            {activeRoute === '/backoffice' && (
              <select 
                value={mesaSelecionada} 
                onChange={(e) => {
                  setMesaSelecionada(e.target.value);
                  localStorage.setItem('backoffice_mesa', e.target.value);
                  // Reload page to reflect mesa change in backoffice
                  window.location.reload();
                }}
                className="ml-4 border border-gray-200 rounded-lg p-2 text-sm text-[#047857] font-bold bg-green-50 focus:outline-none"
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
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
