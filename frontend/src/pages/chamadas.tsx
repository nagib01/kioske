import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

interface Ticket {
  id: string;
  token: string;
  codigo_senha: string;
  posicao_fila: number;
  prioridade: boolean;
  prioridade_nivel: number;
  estado: string;
  alertas: string[];
  criado_em: string;
  servico_id: string;
  servico?: { nome: string };
  aluno_token: string;
  aluno_nome?: string;
  mesa_atendimento?: string;
  updated_at: string;
}

interface Servico {
  id: string;
  nome: string;
  mesas?: string[];
}

const TABLES = (process.env.NEXT_PUBLIC_MONITOR_TABLES || '01,02,03,04').split(',').map(t => t.trim());
const AVG_SERVICE_TIME = parseInt(process.env.NEXT_PUBLIC_AVG_SERVICE_TIME || '12', 10);

export default function ChamadasPage() {
  const [waitingTickets, setWaitingTickets] = useState<Ticket[]>([]);
  const [currentCalled, setCurrentCalled] = useState<Ticket | null>(null);
  const [calledByTable, setCalledByTable] = useState<Record<string, Ticket>>({});
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playChime = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/chime.mp3');
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  };

  const processQueueData = useCallback((tickets: Ticket[]) => {
    const waiting = tickets.filter(t => t.estado === 'waiting');
    const called = tickets.filter(t => t.estado === 'called' && t.mesa_atendimento);

    const sortedWaiting = [...waiting].sort((a, b) => {
      if (b.prioridade_nivel !== a.prioridade_nivel) return b.prioridade_nivel - a.prioridade_nivel;
      return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime();
    });
    setWaitingTickets(sortedWaiting);

    const tableMap: Record<string, Ticket> = {};
    for (const t of called) {
      const key = t.mesa_atendimento!;
      if (!tableMap[key] || new Date(t.updated_at) > new Date(tableMap[key].updated_at)) {
        tableMap[key] = t;
      }
    }
    setCalledByTable(tableMap);

    if (called.length > 0) {
      const sortedCalled = [...called].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setCurrentCalled(sortedCalled[0]);
    } else {
      setCurrentCalled(null);
    }
  }, []);

  const carregarFila = useCallback(async (escolaOverride?: string) => {
    try {
      const escolaId = escolaOverride || localStorage.getItem('backoffice_escola') || process.env.NEXT_PUBLIC_DEFAULT_ESCOLA_ID || '1';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fila?escolaId=${encodeURIComponent(escolaId)}`);
      if (!res.ok) throw new Error('Falha ao carregar fila');
      const data: Ticket[] = await res.json();
      processQueueData(data);
      setError(null);
    } catch (e: any) {
      console.error('Erro ao carregar fila', e);
      setError(e.message || 'Erro ao carregar fila');
    } finally {
      setLoading(false);
    }
  }, [processQueueData]);

  const carregarServicos = useCallback(async () => {
    try {
      const escolaId = localStorage.getItem('backoffice_escola') || process.env.NEXT_PUBLIC_DEFAULT_ESCOLA_ID || '1';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/servicos?escolaId=${encodeURIComponent(escolaId)}`);
      if (res.ok) {
        const data = await res.json();
        setServicos(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const escolaId = localStorage.getItem('backoffice_escola') || process.env.NEXT_PUBLIC_DEFAULT_ESCOLA_ID || '1';

    carregarServicos().then(() => carregarFila(escolaId));

    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    const connectWs = () => {
      if (wsRef.current) wsRef.current.close();
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ action: 'register', role: 'monitor', escolaId }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.evento === 'ticket_chamado') {
            const ticket = msg.dados as Ticket;
            setCurrentCalled(ticket);
            if (ticket.mesa_atendimento) {
              setCalledByTable(prev => ({ ...prev, [ticket.mesa_atendimento!]: ticket }));
            }
            playChime();
          }
          if (['novo_ticket', 'ticket_finalizado'].includes(msg.evento)) {
            carregarFila(escolaId);
          }
        } catch {}
      };

      ws.onclose = () => { reconnectRef.current = setTimeout(connectWs, 3000); };
      ws.onerror = () => ws.close();
    };

    connectWs();
    const pollingInterval = setInterval(() => carregarFila(escolaId), 5000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollingInterval);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [carregarFila, carregarServicos]);

  const waitingList = waitingTickets.slice(0, 5);

  const visibleMesas = servicos.length > 0
    ? Array.from(new Set(servicos.flatMap(s => s.mesas || TABLES)))
    : TABLES;

  const servicoPorMesa: Record<string, string> = {};
  for (const s of servicos) {
    for (const m of (s.mesas || [])) {
      servicoPorMesa[m] = s.nome;
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Head>
        <title>Senhas Chamadas | Kioske Digital</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* Mobile header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm sm:text-base font-black text-[#047857] uppercase tracking-wider truncate">Kioske Digital</h1>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <h2 className="text-sm font-bold text-gray-800 hidden sm:inline">Senhas Chamadas</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold text-[10px] sm:text-xs tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="hidden sm:inline">LIVE</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto">
        {/* Left / Main content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
          {/* Table grid - compact on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            {visibleMesas.map(table => {
              const ticket = calledByTable[table];
              const servicoNome = servicoPorMesa[table];
              return (
                <div key={table} className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-sm border flex flex-col justify-center items-center min-h-[3.5rem] sm:min-h-[5rem] ${ticket ? 'border-gray-100' : 'border-dashed border-gray-300'}`}>
                   <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">MESA {table}</p>
                  {ticket ? (
                    <>
                      <p className="text-lg sm:text-2xl md:text-3xl font-black text-gray-700">{ticket.token}</p>
                      {servicoNome && <p className="text-[8px] sm:text-[10px] text-gray-400 mt-0.5 truncate max-w-full">{servicoNome}</p>}
                    </>
                  ) : (
                    <p className="text-base sm:text-xl font-bold text-gray-300">---</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current called ticket */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-md sm:shadow-xl overflow-hidden border border-gray-100 max-w-lg mx-auto">
              <div className="bg-[#047857] text-white text-center py-2 sm:py-3 tracking-wider font-bold text-[10px] sm:text-sm uppercase px-4">
                {currentCalled?.mesa_atendimento ? `MESA ${currentCalled.mesa_atendimento}` : 'AGUARDANDO CHAMADA'}
              </div>
              <div className="p-6 sm:p-10 md:p-14 flex flex-col items-center justify-center">
                <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-none font-black text-[#047857] mb-4 sm:mb-6 tracking-tighter break-all text-center">
                  {currentCalled?.token || '---'}
                </h1>
                {currentCalled?.aluno_nome && (
                  <div className="bg-green-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-2 sm:gap-3 w-full justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <p className="text-green-800 text-sm sm:text-base font-bold truncate">{currentCalled.aluno_nome}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar - waiting list (hidden on small mobile, slide-in on larger) */}
        <aside className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 sm:p-5 lg:p-6 flex flex-col max-h-[50vh] lg:max-h-none">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h2 className="text-sm sm:text-base font-bold text-gray-800">Próximos na Fila</h2>
            <span className="text-xs text-gray-400 font-medium">{waitingTickets.length} aguardando</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-3 border-[#047857]/30 border-t-[#047857] rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
            ) : waitingList.length > 0 ? (
              waitingList.map((ticket, idx) => {
                const isUrgent = ticket.prioridade_nivel >= 2;
                const isMedium = ticket.prioridade_nivel === 1;
                const estimatedTime = (idx + 1) * AVG_SERVICE_TIME;

                return (
                  <div
                    key={ticket.id}
                    className={`p-3 sm:p-4 rounded-xl border-l-4 flex justify-between items-center ${
                      isUrgent
                        ? 'bg-red-50 border-red-500'
                        : isMedium
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <h3 className={`text-base sm:text-lg font-black ${isUrgent ? 'text-red-600' : 'text-[#047857]'}`}>
                        {ticket.token}
                      </h3>
                      <p className={`text-[10px] sm:text-xs ${isUrgent ? 'text-red-500 font-bold' : isMedium ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>
                        {isUrgent ? 'Urgente' : isMedium ? 'Prioritário' : 'Normal'}
                      </p>
                      {ticket.servico?.nome && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{ticket.servico.nome}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      {isUrgent ? (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Próximo</p>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Espera</p>
                          <p className="text-sm sm:text-base font-bold text-gray-800">{estimatedTime} min</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 font-medium">Fila vazia</p>
                <p className="text-xs text-gray-400">Nenhum aluno a aguardar</p>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="bg-white border-t border-gray-200 px-4 py-2 sm:px-6 sm:py-3 flex justify-between items-center text-[10px] sm:text-xs text-gray-400">
        <span>{date}</span>
        <span className="font-bold text-gray-600">{time}</span>
      </footer>
    </div>
  );
}