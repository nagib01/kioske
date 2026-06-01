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
  instrutor?: string;
  realizada: boolean;
}

type Tab = 'perfil' | 'senhas' | 'aulas' | 'sessoes';

export default function StudentAccountPage() {
  const router = useRouter();
  const { student, isAuthenticated, isLoading, logout, getAccessToken, refreshSession } = useStudentAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [carregandoTickets, setCarregandoTickets] = useState(false);
  const [carregandoAulas, setCarregandoAulas] = useState(false);
  const [carregandoSessoes, setCarregandoSessoes] = useState(false);

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
        `${process.env.NEXT_PUBLIC_API_URL}/admin/students/${student.id}/lessons`,
        { headers: authHeaders() }
      );
      if (res.ok) setAulas(await res.json());
    } catch {
      addToast('Erro ao carregar aulas', 'error');
    } finally {
      setCarregandoAulas(false);
    }
  }, [student, authHeaders, addToast]);

  const fetchSessoes = useCallback(async () => {
    if (!student) return;
    setCarregandoSessoes(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/sessions`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setSessoes(data.sessions || []);
      }
    } catch {
    } finally {
      setCarregandoSessoes(false);
    }
  }, [student, authHeaders]);

  useEffect(() => {
    if (activeTab === 'senhas') fetchTickets();
    if (activeTab === 'aulas') fetchAulas();
    if (activeTab === 'sessoes') fetchSessoes();
  }, [activeTab]);

  const handleLogoutAll = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/logout/all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student?.id }),
      });
      await logout();
      router.push('/aluno/login');
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#047857]/30 border-t-[#047857] rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) return null;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'perfil', label: 'Perfil', icon: '👤' },
    { key: 'senhas', label: 'Senhas', icon: '🎫' },
    { key: 'aulas', label: 'Aulas', icon: '📚' },
    { key: 'sessoes', label: 'Sessões', icon: '🔐' },
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">{student.nome}</span>
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
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#047857] flex items-center justify-center text-white text-2xl font-bold">
              {student.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{student.nome}</h2>
              <p className="text-gray-500">{student.email || 'Sem email registado'}</p>
              {student.numero_estudante && (
                <p className="text-sm text-gray-400">#{student.numero_estudante}</p>
              )}
            </div>
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

        {/* Perfil Tab */}
        {activeTab === 'perfil' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-700 mb-4">Dados Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium">Nome</p>
                <p className="text-gray-800 font-medium">{student.nome}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium">Email</p>
                <p className="text-gray-800">{student.email || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium">Nº de Estudante</p>
                <p className="text-gray-800">{student.numero_estudante || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium">Telefone</p>
                <p className="text-gray-800">{student.telefone || '-'}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="font-bold text-gray-700 mb-3">Segurança</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleLogoutAll}
                  className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
                >
                  Terminar todas as sessões
                </button>
              </div>
            </div>
          </div>
        )}

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
                      <th className="text-left p-3 text-xs font-bold text-gray-600">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aulas.map(a => (
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
                        <td className="p-3 text-sm text-gray-600">{a.instrutor || '-'}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                            a.realizada ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {a.realizada ? 'Realizada' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sessões Tab */}
        {activeTab === 'sessoes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-700">Sessões Ativas</h3>
              <button
                onClick={handleLogoutAll}
                className="text-xs text-red-600 font-medium hover:underline"
              >
                Terminar todas
              </button>
            </div>
            {carregandoSessoes ? (
              <div className="p-8 text-center text-gray-500">A carregar...</div>
            ) : sessoes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">🔐</p>
                <p>Nenhuma sessão ativa</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sessoes.map((s: any) => (
                  <div key={s.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-800 font-medium">
                        {s.user_agent?.substring(0, 50) || 'Desconhecido'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.ip_address || 'IP desconhecido'} &middot;
                        Criada em {new Date(s.created_at).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      Expira {new Date(s.expires_at).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
