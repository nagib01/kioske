import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useStudentAuth } from '../../contexts/StudentAuthContext';
import { useToast } from '../../components/Toast';
import Logo from '../../components/Logo';
import { useStudentAccount } from '../../hooks/useStudentAccount';
import ProfileCard from '../../components/aluno/conta/ProfileCard';
import ContaAulasTab from '../../components/aluno/conta/ContaAulasTab';
import ContaNotificacoesTab from '../../components/aluno/conta/ContaNotificacoesTab';
import ChangePasswordModal from '../../components/aluno/conta/ChangePasswordModal';

type Tab = 'aulas' | 'notificacoes';

export default function StudentAccountPage() {
  const router = useRouter();
  const { student, isAuthenticated, isLoading, logout, changePassword, logoutAll } = useStudentAuth();
  const { addToast } = useToast();

  const {
    aulas,
    notifications,
    naoLidas,
    carregandoAulas,
    carregandoNotificacoes,
    fetchAulas,
    fetchNotificacoes,
    marcarLida,
    marcarTodasLidas,
  } = useStudentAccount();

  const [activeTab, setActiveTab] = useState<Tab>('aulas');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (activeTab === 'aulas') fetchAulas();
    if (activeTab === 'notificacoes') fetchNotificacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleChangePassword = async (senhaAtual: string, novaSenha: string): Promise<boolean> => {
    try {
      await changePassword(senhaAtual, novaSenha);
      addToast('Senha alterada com sucesso!', 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro ao alterar senha', 'error');
      return false;
    }
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) return null;

  const tabs: { key: Tab; label: string; badge?: string | number }[] = [
    { key: 'aulas', label: 'Aulas' },
    { key: 'notificacoes', label: 'Notificações', badge: naoLidas > 0 ? naoLidas : undefined },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <Head>
        <title>Minha Conta | Kioske Digital</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <header className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <Logo className="text-sm" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 hidden sm:block truncate max-w-[120px]">{student.nome}</span>
          <button
            onClick={logout}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 px-3 rounded-lg text-xs transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4">
        <ProfileCard
          student={student}
          onChangePassword={() => setShowPasswordModal(true)}
          onLogoutAll={handleLogoutAll}
        />

        <div className="flex border-b border-gray-200 mb-4 -mx-4 px-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="ml-1.5 bg-brand text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'aulas' && <ContaAulasTab aulas={aulas} loading={carregandoAulas} />}
        {activeTab === 'notificacoes' && (
          <ContaNotificacoesTab
            notifications={notifications}
            naoLidas={naoLidas}
            loading={carregandoNotificacoes}
            onMarcarLida={marcarLida}
            onMarcarTodasLidas={marcarTodasLidas}
          />
        )}

        {showPasswordModal && (
          <ChangePasswordModal onClose={() => setShowPasswordModal(false)} onSubmit={handleChangePassword} />
        )}
      </main>
    </div>
  );
}
