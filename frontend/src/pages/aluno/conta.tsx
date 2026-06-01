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

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'senhas', label: 'Senhas', icon: '🎫' },
    { key: 'aulas', label: 'Aulas', icon: '📚' },
    { key: 'notificacoes', label: `Notificações${naoLidas > 0 ? ` (${naoLidas})` : ''}`, icon: '🔔' },
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
      </Head>

      <header className="bg-white px-6 py-4 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#047857] uppercase tracking-wide">Kioske Digital Universal</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:block">
            {student.nome}
            {student.numero_estudante && <span className="text-gray-400 ml-1">#{student.numero_estudante}</span>}
          </span>
          <button
            onClick={logout}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[#047857] flex items-center justify-center text-white text-2xl font-bold">
              {student.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{student.nome}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Email</p>
              <p className="text-sm text-gray-800">{student.email || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Telefone</p>
              <p className="text-sm text-gray-800">{student.telefone || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Nº de Estudante</p>
              <p className="text-sm text-gray-800">{student.numero_estudante || '-'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Alterar senha
            </button>
            <button
              onClick={handleLogoutAll}
              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Terminar todas as sessões
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-[#047857] text-[#047857]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Senhas Tab */}
        {activeTab === 'senhas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-700">Histórico de Senhas</h3>
            </div>
            {carregandoTickets ? (
              <div className="p-8 text-center text-gray-500">A carregar...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">🎫</p>
                <p>Nenhuma senha registada</p>
                <button
                  onClick={() => router.push('/aluno')}
                  className="mt-4 text-[#047857] font-medium hover:underline"
                >
                  Retirar senha agora
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Senha</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Serviço</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Estado</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Mesa</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-sm font-mono font-bold text-gray-700">{t.codigo_senha}</td>
                        <td className="p-3 text-sm text-gray-600">{t.servico_nome}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[t.status] || 'bg-gray-100'}`}>
                            {statusLabel[t.status] || t.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{t.mesa_atendimento || '-'}</td>
                        <td className="p-3 text-sm text-gray-500">
                          {new Date(t.created_at).toLocaleDateString('pt-PT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Aulas Tab */}
        {activeTab === 'aulas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-700">Registo de Aulas</h3>
            </div>
            {carregandoAulas ? (
              <div className="p-8 text-center text-gray-500">A carregar...</div>
            ) : aulas.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">📚</p>
                <p>Nenhuma aula registada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Tipo</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Data</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Horário</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Instrutor</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Carro</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
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
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-sm">
                          <span className={`font-bold ${a.tipo === 'pratica' ? 'text-blue-600' : 'text-purple-600'}`}>
                            {a.tipo === 'pratica' ? 'Prática' : 'Teórica'}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {new Date(a.data).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {a.hora_inicio?.substring(0, 5) || '-'}
                          {a.hora_fim ? ` - ${a.hora_fim.substring(0, 5)}` : ''}
                        </td>
                        <td className="p-3 text-sm text-gray-600">{a.instructor_nome || '-'}</td>
                        <td className="p-3 text-sm text-gray-600">{a.car_matricula || '-'}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[a.status] || 'bg-gray-100'}`}>
                            {statusLabels[a.status] || a.status}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Notificações Tab */}
        {activeTab === 'notificacoes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-700">Notificações</h3>
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas} className="text-xs text-[#047857] font-medium hover:underline">
                  Marcar todas como lidas
                </button>
              )}
            </div>
            {carregandoNotificacoes ? (
              <div className="p-8 text-center text-gray-500">A carregar...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">🔔</p>
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.lida ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex-1">
                      <p className={`text-sm ${n.lida ? 'text-gray-700' : 'text-gray-900 font-bold'}`}>{n.titulo}</p>
                      {n.mensagem && <p className="text-xs text-gray-500 mt-1">{n.mensagem}</p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('pt-PT')} {new Date(n.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {!n.lida && (
                      <button onClick={() => marcarLida(n.id)} className="text-xs text-[#047857] font-medium hover:underline shrink-0 mt-1">
                        Marcar lida
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="font-bold text-gray-800 text-lg mb-4">Alterar Senha</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                  <input
                    type="password"
                    value={senhaAtual}
                    onChange={e => setSenhaAtual(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-400 mt-1">Mínimo de 6 caracteres</p>
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
                    {alterandoSenha ? 'A alterar...' : 'Alterar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => router.push('/aluno')}
            className="flex-1 bg-[#047857] hover:bg-[#065f46] text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg text-center"
          >
            Retirar Nova Senha
          </button>
        </div>
      </main>
    </div>
  );
}
