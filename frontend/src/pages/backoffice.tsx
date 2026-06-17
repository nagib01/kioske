import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import BackofficeMenu from '../components/BackofficeMenu';
import { useToast } from '../components/Toast';

interface ServicoOption {
  id: string;
  nome: string;
}

interface Ticket {
  id: string;
  token: string;
  posicao_fila: number;
  prioridade: boolean;
  criado_em: string;
  estado: string;
  servico: { nome: string };
  aluno_nome?: string;
  prioridade_nivel?: number;
  alertas?: string[];
  mesa_atendimento?: string;
}

export default function Backoffice() {
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const [userNome, setUserNome] = useState('Maria Silva');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [mesaSelecionada, setMesaSelecionada] = useState('01');
  const [alertasSistema, setAlertasSistema] = useState<{mensagem: string, tipo: string}[]>([]);
  const [stats, setStats] = useState({ atendidosHoje: 0, tempoMedioEspera: 0 });

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [servicos, setServicos] = useState<ServicoOption[]>([]);
  const [novoTicketServico, setNovoTicketServico] = useState('');
  const [novoTicketNome, setNovoTicketNome] = useState('');
  const [showTransfer, setShowTransfer] = useState<string | null>(null);
  const [transferMesa, setTransferMesa] = useState('01');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('backoffice_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  const loadQueue = async () => {
    setLoading(true);
    try {
      const escolaId = localStorage.getItem('backoffice_escola');
      if (!escolaId) {
        console.error('Nenhuma escola selecionada');
        setAlertasSistema(prev => [...prev, { mensagem: 'Erro: nenhuma escola configurada.', tipo: 'error' }]);
        setLoading(false);
        return;
      }

      // Fetch school-wide queue, ordered by priority_level DESC, created_at ASC
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fila/escola/${escolaId}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        
        // Map API tickets to UI format
        const ticketsMapped = (data.tickets || []).map((t: any) => ({
          id: t.id,
          token: t.senha_gerada,
          aluno_nome: t.aluno_nome || `Cliente ${t.senha_gerada}`,
          servico: { nome: t.servico_nome || 'Atendimento' },
          criado_em: t.created_at,
          estado: t.estado || 'waiting',
          posicao_fila: t.posicao_fila || 0,
          prioridade: false, // Legacy field, not used anymore
          prioridade_nivel: t.priority_level || 0, // NEW: 0=normal, 1=medium, 2=urgent
          alertas: t.alertas || [], // NEW: array of alert types
          mesa_atendimento: t.mesa_atendimento || '',
        }));
        
        setTickets(ticketsMapped);
        if (data.stats) {
          setStats({
            atendidosHoje: data.stats.atendidosHoje || 0,
            tempoMedioEspera: data.stats.tempoMedioEspera || 0
          });
        }

        
        // Extract and display alerts
        const alertasUnicos = new Set();
        const alertasLabels: Record<string, string> = {
          urgencia_menos_10min: 'Urgência: menos de 10 minutos',
          hora_marcada: 'Exame com hora marcada',
          documento_faltando: 'Documentação em falta',
        };
        
        ticketsMapped.forEach((t: any) => {
          (t.alertas || []).forEach((alerta: string) => {
            const label = alertasLabels[alerta] || alerta;
            alertasUnicos.add(label);
          });
        });
        
        setAlertasSistema(Array.from(alertasUnicos).map(a => ({ mensagem: String(a), tipo: 'warning' })));
      }
    } catch (err) {
      console.error('Erro ao carregar fila:', err);
      setAlertasSistema(prev => [...prev, { mensagem: 'Erro ao conectar à fila em tempo real.', tipo: 'error' }]);
    } finally {
      setLoading(false);
    }
  };


  const setupWebSocket = (token: string) => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL!;
    
    const ws = new WebSocket(`${wsUrl}/ws`);
    
    ws.onopen = () => {
      // Register as receptionist for the school
      const escolaId = localStorage.getItem('backoffice_escola');
      ws.send(JSON.stringify({
        action: 'register',
        role: 'recepcionista',
        escolaId: escolaId,
        token: token,
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Handle real-time queue updates
        if (msg.evento === 'novo_ticket' || msg.evento === 'ticket_chamado' || msg.evento === 'ticket_finalizado' || msg.evento === 'queue_update') {
          // Reload queue to reflect changes
          loadQueue();
        }
      } catch (err) {
        console.error('Erro ao processar mensagem WebSocket:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Erro WebSocket:', error);
      setAlertasSistema(prev => [...prev, { mensagem: 'Conexão em tempo real perdida. Recarregando...', tipo: 'warning' }]);
    };
    
    ws.onclose = () => {
      console.log('WebSocket desconectado. Tentando reconectar em 5s...');
      setTimeout(() => setupWebSocket(token), 5000);
    };
    
    wsRef.current = ws;
  };

  const chamarProximo = async () => {
    setLoading(true);
    try {
      // Get first waiting ticket from current queue
      const proximoTicket = tickets.find(t => t.estado === 'waiting');
      if (!proximoTicket) {
        addToast('Nenhum cliente aguardando.', 'warning');
        setLoading(false);
        return;
      }

      // Call the receptionist endpoint to mark ticket as called
      // For now, we call for a general queue (would need to extend API if service-specific)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recepcionista/chamar/${proximoTicket.id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ mesa: mesaSelecionada }),
      });
      
      if (response.ok) {
        // Reload queue after calling
        await loadQueue();
      } else {
        addToast('Erro ao chamar cliente.', 'error');
      }
    } catch (err) {
      console.error('Erro ao chamar próximo:', err);
      addToast('Erro ao chamar cliente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('backoffice_token');
    const nome = localStorage.getItem('backoffice_nome');
    const avatar = localStorage.getItem('backoffice_avatar');
    const mesa = localStorage.getItem('backoffice_mesa');
    
    if (nome) setUserNome(nome);
    if (avatar) setUserAvatar(avatar);
    if (mesa) setMesaSelecionada(mesa);

    if (token) {
      setupWebSocket(token);
      loadQueue();
    }

    const pollingInterval = setInterval(() => {
      loadQueue();
    }, 10000);

    return () => {
      wsRef.current?.close();
      clearInterval(pollingInterval);
    };
  }, []);


  const carregarServicos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/servicos`);
      if (res.ok) {
        const data = await res.json();
        setServicos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar servicos', err);
    }
  };

  const handleCriarTicket = async () => {
    if (!novoTicketServico) { addToast('Selecione um servico', 'warning'); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          servicoId: novoTicketServico,
          alunoNome: novoTicketNome || undefined,
        }),
      });
      if (res.ok) {
        setShowNewTicket(false);
        setNovoTicketServico('');
        setNovoTicketNome('');
        await loadQueue();
      } else {
        const errData = await res.json();
        addToast(errData.error || 'Erro ao criar senha', 'error');
      }
    } catch (err) {
      console.error('Erro ao criar ticket', err);
      addToast('Erro ao criar senha', 'error');
    }
  };

  const handleTransferir = async (ticketId: string) => {
    if (!transferMesa) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${ticketId}/transferir`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ mesa: transferMesa }),
      });
      if (res.ok) {
        setShowTransfer(null);
        await loadQueue();
      } else {
        const errData = await res.json();
        addToast(errData.error || 'Erro ao transferir', 'error');
      }
    } catch (err) {
      console.error('Erro ao transferir', err);
      addToast('Erro ao transferir senha', 'error');
    }
  };

  const pessoasAguardando = tickets.filter(t => t.estado === 'waiting').length;
  const prioritarios = tickets.filter(t => t.estado === 'waiting' && (t.prioridade_nivel === 2 || t.prioridade_nivel === 1)).length;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans">
      <Head>
        <title>Painel da Rececionista | Kioske Digital</title>
      </Head>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-lg font-bold text-[#047857]">Backoffice Terminal</h1>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Driving School Admin</p>
        </div>
        <BackofficeMenu activeRoute="/backoffice" />
        <div className="p-6 border-t border-gray-100 flex items-center gap-3">
          {userAvatar ? (
            <img src={userAvatar} alt={userNome} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 bg-[#047857] rounded-full flex items-center justify-center text-white font-bold uppercase">
              {userNome.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-800">{userNome}</p>
            <p className="text-xs text-gray-500">Rececionista</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-[#047857] border-r border-gray-300 pr-4">KIOSKE DIGITAL UNIVERSAL</h2>
            <span className="text-gray-600 font-medium">Painel da Rececionista</span>
            <select 
              value={mesaSelecionada} 
              onChange={(e) => {
                setMesaSelecionada(e.target.value);
                localStorage.setItem('backoffice_mesa', e.target.value);
              }}
              className="ml-4 border border-gray-200 rounded-lg p-2 text-sm text-[#047857] font-bold bg-green-50 focus:outline-none"
            >
              <option value="01">Mesa 01</option>
              <option value="02">Mesa 02</option>
              <option value="03">Mesa 03</option>
              <option value="04">Mesa 04</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> ONLINE
            </span>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="md:col-span-2 bg-[#047857] text-white rounded-2xl p-6 shadow-lg flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-10 -top-10 opacity-10">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <div className="relative z-10">
                <p className="text-green-100 text-sm font-bold tracking-wider mb-1">STATUS ATUAL DA FILA</p>
                <h3 className="text-4xl font-black mb-2">{pessoasAguardando} Pessoas<br/>Aguardando</h3>
                <p className="text-green-100 text-sm">Tempo médio de espera: {stats.tempoMedioEspera} minutos</p>
              </div>
              <div className="relative z-10">
                <button onClick={chamarProximo} disabled={loading} className="bg-white text-[#047857] hover:bg-green-50 font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {loading ? 'A chamar...' : 'Chamar Próximo'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col justify-between">
              <div className="text-gray-400 mb-2">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h4 className="text-3xl font-black text-gray-800">{stats.atendidosHoje}</h4>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Atendidos Hoje</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col justify-between">
              <div className="text-red-400 mb-2">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h4 className="text-3xl font-black text-gray-800">{prioritarios < 10 ? `0${prioritarios}` : prioritarios}</h4>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Prioritários</p>
              </div>
            </div>
          </div>

          {/* Fila ao Vivo e Ações */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xl font-bold text-gray-800">Fila de Espera ao Vivo</h3>
                <div className="flex gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#047857]"></span> Normal</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Médio</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600"></span> Urgente</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">A fila está vazia no momento.</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {tickets.filter(t => t.estado === 'waiting').map((ticket, idx) => {
                      const tempoEspera = Math.floor((new Date().getTime() - new Date(ticket.criado_em).getTime()) / 60000);
                      const priorityLevel = ticket.prioridade_nivel || 0;
                      const isUrgente = priorityLevel === 2;
                      const isMedio = priorityLevel === 1;
                      
                      // Determine color based on priority level
                      const bgColor = isUrgente ? 'bg-red-100 text-red-600 border border-red-200' : isMedio ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-green-100 text-[#047857] border border-green-200';
                      const statusColor = isUrgente ? 'bg-red-600' : isMedio ? 'bg-orange-500' : 'bg-gray-200';
                      const statusLabel = isUrgente ? 'Urgente' : isMedio ? 'Médio' : 'Normal';
                      
                      return (
                        <li key={ticket.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                          <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-lg font-black ${bgColor}`}>
                            {ticket.token}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-gray-800">{ticket.aluno_nome}</h4>
                              <span className={`${statusColor} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase`}>{statusLabel}</span>
                              
                              {/* Display alerts as badges */}
                              {ticket.alertas && ticket.alertas.length > 0 && (
                                <>
                                  {ticket.alertas.includes('urgencia_menos_10min') && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Urgência</span>}
                                  {ticket.alertas.includes('hora_marcada') && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">Hora Marcada</span>}
                                  {ticket.alertas.includes('documento_faltando') && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded">Documentos</span>}
                                </>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              {ticket.servico?.nome || 'Atendimento Geral'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${isUrgente ? 'text-red-600' : isMedio ? 'text-orange-500' : 'text-gray-800'}`}>{tempoEspera > 0 ? tempoEspera : '< 1'} min</p>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Espera</p>
                          </div>
                          {ticket.estado === 'called' && (
                            <button
                              onClick={() => {
                                setShowTransfer(ticket.id);
                                setTransferMesa(ticket.mesa_atendimento || '01');
                              }}
                              className="text-blue-600 hover:text-blue-800 px-2 text-sm font-bold"
                              title="Transferir para outra mesa"
                            >
                              ⇄
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <a href="#" className="text-sm font-bold text-[#047857] hover:underline">Ver Lista Completa</a>
                </div>
              </div>
            </div>

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
                    className="border border-green-200 text-[#047857] hover:bg-green-50 font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nova Senha
                  </button>
                  <button className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
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

              {/* Modal: Nova Senha */}
              {showNewTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Nova Senha Manual</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
                        <select
                          value={novoTicketServico}
                          onChange={e => setNovoTicketServico(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2"
                        >
                          <option value="">Selecione...</option>
                          {servicos.map(s => (
                            <option key={s.id} value={s.id}>{s.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Aluno (opcional)</label>
                        <input
                          type="text"
                          value={novoTicketNome}
                          onChange={e => setNovoTicketNome(e.target.value)}
                          placeholder="Ex: João Silva"
                          className="w-full border border-gray-300 rounded-lg p-2"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                      <button onClick={() => setShowNewTicket(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
                      <button onClick={handleCriarTicket} className="px-6 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-lg font-bold">Criar Senha</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal: Transferir */}
              {showTransfer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Transferir Senha</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mesa de Destino</label>
                        <select
                          value={transferMesa}
                          onChange={e => setTransferMesa(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2"
                        >
                          <option value="01">Mesa 01</option>
                          <option value="02">Mesa 02</option>
                          <option value="03">Mesa 03</option>
                          <option value="04">Mesa 04</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                      <button onClick={() => setShowTransfer(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
                      <button onClick={() => handleTransferir(showTransfer)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">Transferir</button>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      </main>

    </div>
  );
}