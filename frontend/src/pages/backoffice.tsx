import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BackofficeMenu from '../components/BackofficeMenu';
import DesktopModal from '../components/DesktopModal';
import { useToast } from '../components/Toast';
import StatsCards from '../components/backoffice/StatsCards';
import QueueList from '../components/backoffice/QueueList';
import NewTicketModal from '../components/backoffice/NewTicketModal';
import CurrentUser from '../components/CurrentUser';
import { clearBackofficeSession } from '../lib/auth';
import { useBackofficeQueue, type BackofficeTicket } from '../hooks/useBackofficeQueue';

export default function Backoffice() {
  const { addToast } = useToast();
  const router = useRouter();
  const {
    tickets,
    loading,
    wsConnected,
    alertasSistema,
    stats,
    servicos,
    servicosComMesas,
    chamarProximo,
    carregarServicos,
    criarTicket,
    transferir,
  } = useBackofficeQueue();

  const [userNome, setUserNome] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('recepcionista');
  const [mesaSelecionada, setMesaSelecionada] = useState('');

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [novoTicketServico, setNovoTicketServico] = useState('');
  const [novoTicketNome, setNovoTicketNome] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [pendingTransferTicket, setPendingTransferTicket] = useState<BackofficeTicket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('backoffice_token');
    const nome = localStorage.getItem('backoffice_nome');
    const avatar = localStorage.getItem('backoffice_avatar');
    const mesa = localStorage.getItem('backoffice_mesa');
    const storedRole = localStorage.getItem('backoffice_role');

    if (nome) setUserNome(nome);
    if (avatar) setUserAvatar(avatar);
    if (mesa) setMesaSelecionada(mesa);
    if (storedRole) {
      setUserRole(storedRole);
    } else if (token) {
      try {
        const p = JSON.parse(atob(token.split('.')[1]));
        if (p.role) setUserRole(p.role);
      } catch {}
    }
  }, []);

  const handleLogout = () => {
    clearBackofficeSession();
    router.push('/login');
  };

  const handleCriarTicket = async () => {
    if (!novoTicketServico) {
      addToast('Selecione um servico', 'warning');
      return;
    }
    const ok = await criarTicket(novoTicketServico, novoTicketNome);
    if (ok) {
      setShowNewTicket(false);
      setNovoTicketServico('');
      setNovoTicketNome('');
    }
  };

  const handleConfirmTransfer = (mesa: string) => {
    if (!pendingTransferTicket) return;
    const ticket = pendingTransferTicket;
    setShowTransferModal(false);
    setPendingTransferTicket(null);
    transferir(ticket.id, mesa);
  };

  const openTransfer = (ticket: BackofficeTicket) => {
    setPendingTransferTicket(ticket);
    setShowTransferModal(true);
  };

  const pessoasAguardando = tickets.filter((t) => t.estado === 'waiting').length;
  const prioritarios = tickets.filter(
    (t) => t.estado === 'waiting' && (t.prioridade_nivel === 2 || t.prioridade_nivel === 1),
  ).length;

  const allMesas =
    servicosComMesas.length > 0
      ? Array.from(new Set(servicosComMesas.flatMap((s: any) => s.mesas || [s.mesa_padrao || '01'])))
      : ['01', '02', '03', '04'];

  return (
    <div className="min-h-screen flex bg-surface font-sans">
      <Head>
        <title>Painel da Rececionista | Kioske Digital</title>
      </Head>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-lg font-bold text-brand">Backoffice Terminal</h1>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Driving School Admin</p>
        </div>
        <BackofficeMenu activeRoute="/" role={userRole} />
        <CurrentUser
          className="p-6 border-t border-gray-100"
          nome={userNome || 'Utilizador'}
          subtitle={userRole === 'admin' ? 'Admin' : 'Rececionista'}
          avatar={userAvatar}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-brand border-r border-gray-300 pr-4">KIOSKE DIGITAL UNIVERSAL</h2>
            <span className="text-gray-600 font-medium">Painel da Rececionista</span>
            <select
              value={mesaSelecionada}
              onChange={(e) => {
                setMesaSelecionada(e.target.value);
                localStorage.setItem('backoffice_mesa', e.target.value);
              }}
              className="ml-4 border border-gray-200 rounded-lg p-2 text-sm text-brand font-bold bg-green-50 focus:outline-none"
            >
              {allMesas.map((m) => (
                <option key={m} value={m}>Mesa {m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 ${wsConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></span> {wsConnected ? 'LIVE' : 'POLLING'}
            </span>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <StatsCards
            pessoasAguardando={pessoasAguardando}
            tempoMedioEspera={stats.tempoMedioEspera}
            atendidosHoje={stats.atendidosHoje}
            prioritarios={prioritarios}
            loading={loading}
            onChamarProximo={() => chamarProximo(mesaSelecionada)}
          />

          {/* Fila ao Vivo e Ações */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <QueueList tickets={tickets} onTransfer={openTransfer} />

            {/* Alertas e Ações */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Alertas do Sistema</h4>
                {alertasSistema.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Nenhum alerta ativo.</p>
                ) : (
                  <div className="space-y-3">
                    {alertasSistema.map((alerta, i) => (
                      <div key={i} className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 text-sm">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <p className="text-red-800 font-medium">{alerta.mensagem}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Equipa Ativa</h4>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white -mr-3 z-30"></div>
                  <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white -mr-3 z-20"></div>
                  <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white z-10"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500 ml-2">+2</div>
                </div>
                <p className="text-sm text-gray-500">5 funcionários em serviço</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Ações Rápidas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      carregarServicos();
                      setShowNewTicket(true);
                    }}
                    className="border border-green-200 text-brand hover:bg-green-50 font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nova Senha
                  </button>
                  <button
                    onClick={() => {
                      const calledTicket = tickets.find((t) => t.estado === 'called');
                      if (calledTicket) {
                        openTransfer(calledTicket);
                      } else {
                        addToast('Nenhum ticket em atendimento.', 'warning');
                      }
                    }}
                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                    Transferir
                  </button>
                </div>
              </div>

              <NewTicketModal
                open={showNewTicket}
                servicos={servicos}
                servico={novoTicketServico}
                onServicoChange={setNovoTicketServico}
                nome={novoTicketNome}
                onNomeChange={setNovoTicketNome}
                onCancel={() => setShowNewTicket(false)}
                onConfirm={handleCriarTicket}
              />

              {showTransferModal && pendingTransferTicket && (
                <DesktopModal
                  mesaAtendimento={pendingTransferTicket.mesa_atendimento}
                  title="Transfer Desk"
                  statusText={pendingTransferTicket.token}
                  onConfirm={handleConfirmTransfer}
                  onCancel={() => {
                    setShowTransferModal(false);
                    setPendingTransferTicket(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
