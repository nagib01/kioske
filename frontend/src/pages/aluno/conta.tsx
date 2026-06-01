import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useStudentAuth } from '../../contexts/StudentAuthContext';
import { useToast } from '../../components/Toast';

interface Ticket {
  id: string;
  codigo_senha: string;
  servico_nome: string;
  status: string;
  priority_level: number;
  created_at: string;
  mesa_atendimento?: string;
}

interface Aula {
  id: string;
  tipo: string;
  data: string;
  hora_inicio?: string;
  hora_fim?: string;
  car_matricula?: string;
  instructor_nome?: string;
  summary?: string;
  status: string;
}

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem?: string;
  lesson_id?: string;
  lida: boolean;
  created_at: string;
}

type Tab = 'senhas' | 'aulas' | 'notificacoes';

export default function StudentAccountPage() {
  const router = useRouter();
  const { student, isAuthenticated, isLoading, logout, getAccessToken, changePassword, logoutAll } = useStudentAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('senhas');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregandoTickets, setCarregandoTickets] = useState(false);
  const [carregandoAulas, setCarregandoAulas] = useState(false);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/aluno/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const authHeaders = useCallback(() => {
    const token = getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [getAccessToken]);

  const fetchTickets = useCallback(async () => {
    if (!student) return;
    setCarregandoTickets(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/students/${student.id}/tickets`,
        { headers: authHeaders() }
      );
      if (res.ok) setTickets(await res.json());
    } catch {
      addToast('Erro ao carregar senhas', 'error');
    } finally {
      setCarregandoTickets(false);
    }
  }, [student, authHeaders, addToast]);

  const fetchAulas = useCallback(async () => {
    if (!student) return;
    setCarregandoAulas(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/lessons`,
        { headers: authHeaders() }
      );
      if (res.ok) setAulas(await res.json());
    } catch {
      addToast('Erro ao carregar aulas', 'error');
    } finally {
      setCarregandoAulas(false);
    }
  }, [student, authHeaders, addToast]);

  const fetchNotificacoes = useCallback(async () => {
    if (!student) return;
    setCarregandoNotificacoes(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/notifications`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setNaoLidas(data.naoLidas || 0);
      }
    } catch {
    } finally {
      setCarregandoNotificacoes(false);
    }
  }, [student, authHeaders]);

  const marcarLida = async (id: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/notifications/${id}/read`, {
      method: 'PUT', headers: authHeaders(),
    });
    fetchNotificacoes();
  };

  const marcarTodasLidas = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/notifications/read-all`, {
      method: 'PUT', headers: authHeaders(),
    });
    fetchNotificacoes();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlterandoSenha(true);
    try {
      await changePassword(senhaAtual, novaSenha);
      addToast('Senha alterada com sucesso!', 'success');
      setShowPasswordModal(false);
      setSenhaAtual('');
      setNovaSenha('');
    } catch (err: any) {
      addToast(err.message || 'Erro ao alterar senha', 'error');
    } finally {
      setAlterandoSenha(false);
    }
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    router.push('/aluno/login');
  };

  useEffect(() => {
    if (activeTab === 'senhas') fetchTickets();
    if (activeTab === 'aulas') fetchAulas();
    if (activeTab === 'notificacoes') fetchNotificacoes();
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#047857]/30 border-t-[#047857] rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) return null;

  const tabs: { key: Tab; label: string; badge?: string | number }[] = [
    { key: 'senhas', label: 'Senhas' },
    { key: 'aulas', label: 'Aulas' },
    { key: 'notificacoes', label: 'Notificações', badge: naoLidas > 0 ? naoLidas : undefined },
  ];

  const statusLabel: Record<string, string> = {
    waiting: 'Em Espera', called: 'Em Atendimento', finished: 'Concluído',
  };

  const statusColor: Record<string, string> = {
    waiting: 'bg-blue-100 text-blue-800',
    called: 'bg-yellow-100 text-yellow-800',
    finished: 'bg-green-100 text-green-800',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Head>
        <title>Minha Conta | Kioske Digital</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <header className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-sm font-bold text-[#047857] uppercase tracking-wide">Kioske Digital</h1>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#047857] flex items-center justify-center text-white text-lg font-bold shrink-0">
              {student.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-800 truncate">{student.nome}</h2>
              <p className="text-xs text-gray-500">{student.email || ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[10px] text-gray-500 font-medium">Email</p>
              <p className="text-xs text-gray-800 truncate">{student.email || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[10px] text-gray-500 font-medium">Telefone</p>
              <p className="text-xs text-gray-800">{student.telefone || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[10px] text-gray-500 font-medium">Nº Estudante</p>
              <p className="text-xs text-gray-800">{student.numero_estudante || '-'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Alterar senha
            </button>
            <button
              onClick={handleLogoutAll}
              className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Terminar sessões
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-4 -mx-4 px-4 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.key
                  ? 'border-[#047857] text-[#047857]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="ml-1.5 bg-[#047857] text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'senhas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-700">Histórico de Senhas</h3>
            </div>
            {carregandoTickets ? (
              <div className="p-6 text-center text-sm text-gray-500">A carregar...</div>
            ) : tickets.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p className="text-sm">Nenhuma senha registada</p>
                <button
                  onClick={() => router.push('/aluno')}
                  className="mt-3 text-xs text-[#047857] font-medium hover:underline"
                >
                  Retirar senha agora
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {tickets.map(t => (
                  <div key={t.id} className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#047857]/10 flex items-center justify-center text-sm font-bold text-[#047857] shrink-0">
                      {t.codigo_senha}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{t.servico_nome}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(t.created_at).toLocaleDateString('pt-PT')} 
                        {t.mesa_atendimento && ` · Mesa ${t.mesa_atendimento}`}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor[t.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel[t.status] || t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'aulas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-700">Registo de Aulas</h3>
            </div>
            {carregandoAulas ? (
              <div className="p-6 text-center text-sm text-gray-500">A carregar...</div>
            ) : aulas.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p className="text-sm">Nenhuma aula registada</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {aulas.map(a => {
                  const statusColors: Record<string, string> = {
                    agendada: 'bg-blue-100 text-blue-800',
                    em_curso: 'bg-yellow-100 text-yellow-800',
                    concluida: 'bg-green-100 text-green-800',
                    cancelada: 'bg-red-100 text-red-800',
                  };
                  const statusLabels: Record<string, string> = {
                    agendada: 'Agendada', em_curso: 'Em Curso', concluida: 'Concluída', cancelada: 'Cancelada',
                  };
                  return (
                    <div key={a.id} className="p-3">
                      <div className="flex items-start gap-2 mb-1">
                        <span className={`text-xs font-bold shrink-0 ${a.tipo === 'pratica' ? 'text-blue-600' : 'text-purple-600'}`}>
                          {a.tipo === 'pratica' ? 'Prática' : 'Teórica'}
                        </span>
                        <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[a.status] || 'bg-gray-100'}`}>
                          {statusLabels[a.status] || a.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p>{new Date(a.data).toLocaleDateString('pt-PT')} {a.hora_inicio?.substring(0, 5) || ''}{a.hora_fim ? ` - ${a.hora_fim.substring(0, 5)}` : ''}</p>
                        <p>{a.instructor_nome && `Instrutor: ${a.instructor_nome}`}{a.car_matricula && ` · ${a.car_matricula}`}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notificacoes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-700">Notificações</h3>
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas} className="text-[10px] text-[#047857] font-medium hover:underline">
                  Marcar todas lidas
                </button>
              )}
            </div>
            {carregandoNotificacoes ? (
              <div className="p-6 text-center text-sm text-gray-500">A carregar...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(n => (
                  <div key={n.id} className={`p-3 flex items-start gap-2 ${!n.lida ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${n.lida ? 'text-gray-700' : 'text-gray-900 font-bold'}`}>{n.titulo}</p>
                      {n.mensagem && <p className="text-[10px] text-gray-500 mt-0.5">{n.mensagem}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(n.created_at).toLocaleDateString('pt-PT')} {new Date(n.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.lida && (
                      <button onClick={() => marcarLida(n.id)} className="text-[10px] text-[#047857] font-medium hover:underline shrink-0 mt-0.5">
                        OK
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={() => router.push('/aluno')}
            className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-bold py-3.5 px-5 rounded-xl transition-colors shadow-sm text-sm"
          >
            Retirar Nova Senha
          </button>
        </div>

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
              <h3 className="font-bold text-gray-800 text-base mb-4">Alterar Senha</h3>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Senha Atual</label>
                  <input
                    type="password"
                    value={senhaAtual}
                    onChange={e => setSenhaAtual(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                    required
                    minLength={6}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Mínimo de 6 caracteres</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowPasswordModal(false); setSenhaAtual(''); setNovaSenha(''); }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={alterandoSenha}
                    className="flex-1 bg-[#047857] hover:bg-[#065f46] text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {alterandoSenha ? '...' : 'Alterar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}