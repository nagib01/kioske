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

const TABLES = ['01', '02', '03', '04'];
const TABLE_LABELS: Record<string, string> = {
  '01': 'MESA 01', '02': 'MESA 02', '03': 'MESA 03', '04': 'MESA 04',
};
const AVG_SERVICE_TIME = 12;

export default function ChamadasPage() {
  const [waitingTickets, setWaitingTickets] = useState<Ticket[]>([]);
  const [currentCalled, setCurrentCalled] = useState<Ticket | null>(null);
  const [calledByTable, setCalledByTable] = useState<Record<string, Ticket>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const processQueueData = useCallback((tickets: Ticket[]) => {
    const waiting = tickets.filter(t => t.estado === 'waiting');
    const called = tickets.filter(
      t => t.estado === 'called' && t.mesa_atendimento && TABLES.includes(t.mesa_atendimento)
    );

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

  const carregarFila = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fila`);
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

  useEffect(() => {
    carregarFila();

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
        ws.send(JSON.stringify({ type: 'auth', isPublicDisplay: true }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.evento === 'ticket_chamado') {
            const ticket = msg.dados as Ticket;
            setCurrentCalled(ticket);
            if (ticket.mesa_atendimento && TABLES.includes(ticket.mesa_atendimento)) {
              setCalledByTable(prev => ({ ...prev, [ticket.mesa_atendimento!]: ticket }));
            }
            const audio = new Audio('/chime.mp3');
            audio.play().catch(() => {});
          }
          if (['novo_ticket', 'ticket_finalizado'].includes(msg.evento)) {
            carregarFila();
          }
        } catch {}
      };

      ws.onclose = () => setTimeout(connectWs, 3000);
      ws.onerror = () => ws.close();
    };

    connectWs();
    const pollingInterval = setInterval(carregarFila, 5000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollingInterval);
      wsRef.current?.close();
    };
  }, [carregarFila]);

  const waitingList = waitingTickets.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      <Head>
        <title>Senhas Chamadas | Kioske Digital</title>
      </Head>

      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-[#047857] uppercase tracking-wider">KIOSKE DIGITAL UNIVERSAL</h1>
          <span className="text-gray-400">|</span>
          <h2 className="text-xl font-bold text-gray-800">Acompanhamento de Fila</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-bold text-sm tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> LIVE SYSTEM
          </div>
        </div>
      </header>

      <div className="flex-1 flex w-full max-w-[1920px] mx-auto">
        <div className="flex-1 p-10 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#047857] flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Senhas Chamadas
            </h2>
            <p className="text-gray-400 font-medium">Última atualização: {time.slice(0, 5)}</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center mb-10 w-full max-w-4xl mx-auto">
            <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-transform duration-500 hover:scale-[1.02]">
              <div className="bg-[#047857] text-white text-center py-4 tracking-widest font-bold text-sm uppercase">
                {currentCalled?.mesa_atendimento ? `MESA DE ATENDIMENTO ${currentCalled.mesa_atendimento}` : 'AGUARDANDO CHAMADA'}
              </div>
              <div className="p-16 flex flex-col items-center justify-center relative">
                <h1 className="text-[12rem] leading-none font-black text-[#047857] mb-8 tracking-tighter">
                  {currentCalled?.token || '---'}
                </h1>
                <div className="bg-[#A7F3D0] px-10 py-4 rounded-xl flex items-center gap-4 animate-pulse">
                  <svg className="w-8 h-8 text-[#065F46]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[#065F46] text-xs font-bold tracking-widest uppercase mb-1">CLIENTE</p>
                    <p className="text-[#064E3B] text-2xl font-black uppercase">
                      {currentCalled?.aluno_nome || '---'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 w-full mt-10">
              {TABLES.map(table => {
                const ticket = calledByTable[table];
                return (
                  <div key={table} className={`bg-white rounded-2xl p-6 text-center shadow-md border flex flex-col justify-center items-center h-32 ${ticket ? 'border-gray-100' : 'border-dashed border-gray-300'}`}>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{TABLE_LABELS[table]}</p>
                    {ticket ? (
                      <p className="text-4xl font-black text-gray-700">{ticket.token}</p>
                    ) : (
                      <p className="text-2xl font-bold text-gray-300">---</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="w-[450px] bg-white border-l border-gray-200 p-8 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Próximos na Fila</h2>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#047857] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 font-medium">{error}</p>
              </div>
            ) : waitingList.length > 0 ? (
              waitingList.map((ticket, idx) => {
                const isUrgent = ticket.prioridade_nivel >= 2;
                const isMedium = ticket.prioridade_nivel === 1;
                const estimatedTime = (idx + 1) * AVG_SERVICE_TIME;

                return (
                  <div
                    key={ticket.id}
                    className={`p-5 rounded-2xl border-l-4 flex justify-between items-center ${
                      isUrgent
                        ? 'bg-red-50 border-red-500 shadow-md'
                        : isMedium
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'bg-gray-50 border-transparent'
                    }`}
                  >
                    <div>
                      <h3 className={`text-2xl font-black ${isUrgent ? 'text-red-600' : 'text-[#047857]'}`}>
                        {ticket.token} {isUrgent && '!'}
                      </h3>
                      <p className={`text-sm ${isUrgent ? 'text-red-500 font-bold' : isMedium ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>
                        {isUrgent ? 'Urgente' : isMedium ? 'Prioritário' : 'Normal'}
                      </p>
                      {ticket.servico?.nome && (
                        <p className="text-xs text-gray-400 mt-1">{ticket.servico.nome}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {isUrgent ? (
                        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-red-500">Próximo</p>
                      ) : (
                        <>
                          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400">Espera Est.</p>
                          <p className="text-xl font-bold text-gray-800">{estimatedTime} min</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="mb-3">
                  <p className="font-medium text-lg text-gray-500">Nenhum ticket em espera</p>
                </div>
                <p className="font-medium text-lg text-gray-500">Fila vazia</p>
                <p className="text-sm text-gray-400">Nenhum aluno a aguardar.</p>
              </div>
            )}
          </div>

          <div className="mt-8 bg-[#047857] p-6 rounded-2xl text-white relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <svg className="w-24 h-24" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" stroke="white" strokeWidth="2" />
                <line x1="12" y1="8" x2="12.01" y2="8" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Atenção ao Painel</h3>
            <p className="text-green-100 text-sm leading-relaxed relative z-10">
              Mantenha o seu comprovante em mãos. Quando a sua senha for chamada, dirija-se à mesa indicada.
            </p>
          </div>
        </aside>
      </div>

      <footer className="bg-[#0F172A] text-gray-400 p-4 px-8 flex justify-between items-center text-sm">
        <div className="flex gap-8 items-center text-white font-medium">
          <span className="flex items-center gap-2">{date}</span>
          <span className="flex items-center gap-2 text-lg font-bold">{time}</span>
        </div>
        <div className="flex gap-8 items-center uppercase tracking-widest text-xs font-bold">
          <span className="flex gap-2">Temperatura Ambiente <span className="text-white">24ºC</span></span>
          <span className="flex gap-2">Qualidade do Ar <span className="text-green-400">EXCELENTE</span></span>
        </div>
      </footer>
    </div>
  );
}
