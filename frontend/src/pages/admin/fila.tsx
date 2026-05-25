import { useEffect, useState, useCallback } from 'react';
import BackofficeLayout from '../../components/BackofficeLayout';

interface Ticket {
  id: string;
  senha_gerada: string;
  aluno_nome: string;
  servico_nome: string;
  estado: 'waiting' | 'called' | 'finished';
  priority_level: number;
  alertas: string[];
  created_at: string;
  posicao_fila: number;
  mesa_atendimento?: string;
}

interface Stats {
  atendidosHoje: number;
  tempoMedioEspera: number;
}

export default function AdminFilaPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ atendidosHoje: 0, tempoMedioEspera: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const getHeaders = () => {
    const token = localStorage.getItem('backoffice_token');
    const escolaId = localStorage.getItem('backoffice_escola');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (escolaId) headers['x-escola-id'] = escolaId;
    return headers;
  };

  const fetchFila = useCallback(async (isPolling = false) => {
    const escolaId = localStorage.getItem('backoffice_escola') || '1';
    
    if (!isPolling) setLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fila/escola/${escolaId}`, {
        headers: getHeaders()
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error('Sessão inválida. Por favor, faça login novamente.');
        throw new Error('Falha ao carregar fila');
      }
      
      const data = await res.json();
      setTickets(data.tickets || []);
      if (data.stats) setStats(data.stats);
      setError(null);
    } catch (err: any) {
      if (!isPolling) setError(err.message || 'Erro desconhecido');
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  // Polling every 5 seconds
  useEffect(() => {
    fetchFila();
    const interval = setInterval(() => {
      fetchFila(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchFila]);

  const handleAction = async (ticketId: string, action: 'chamar' | 'finalizar') => {
    setActionLoading(ticketId);
    try {
      const endpoint = action === 'chamar' 
        ? `/api/recepcionista/chamar/${ticketId}`
        : `/api/recepcionista/finalizar/${ticketId}`;
        
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ mesa: '' }),
      });

      if (!res.ok) throw new Error(`Falha ao ${action} ticket`);
      
      // Refresh list immediately after action
      await fetchFila(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper function to format time elapsed
  const getTempoEspera = (isoDate: string) => {
    const start = new Date(isoDate).getTime();
    const now = new Date().getTime();
    const diffMins = Math.floor((now - start) / 60000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins === 1) return '1 min';
    if (diffMins > 60) {
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hrs}h ${mins}m`;
    }
    return `${diffMins} min`;
  };

  return (
    <BackofficeLayout activeRoute="/admin/fila" title="Fila em Tempo Real | Kioske Digital">
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800">Fila em Tempo Real</h2>
            <p className="text-gray-500 mt-1">Acompanhe e gira os tickets da escola</p>
          </div>
          <div className="flex items-center gap-3">
             <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
             </span>
             <span className="text-sm font-semibold text-gray-600">A sincronizar...</span>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-medium text-gray-600">Filtrar por estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
          >
            <option value="">Todos (waiting + called)</option>
            <option value="waiting">Em Espera</option>
            <option value="called">Em Atendimento</option>
            <option value="finished">Finalizados</option>
          </select>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-2xl">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Atendidos Hoje</p>
              <h3 className="text-3xl font-black text-gray-800">{stats.atendidosHoje}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 text-2xl">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tempo Médio de Espera</p>
              <h3 className="text-3xl font-black text-gray-800">{stats.tempoMedioEspera} <span className="text-lg font-bold text-gray-400">min</span></h3>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Live Queue Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-[#047857] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">A carregar fila...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 font-bold text-gray-600">Senha</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Serviço</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Aluno</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Prioridade</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Estado / Espera</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <div className="text-lg font-medium text-gray-500 mb-3">Nenhum ticket em espera</div>
                      <p className="font-medium text-lg">A fila está vazia</p>
                      <p className="text-sm">Nenhum aluno a aguardar atendimento.</p>
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className={`transition-colors ${ticket.estado === 'called' ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-4 px-6">
                        <span className="font-black text-xl text-[#047857]">{ticket.senha_gerada}</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-700">{ticket.servico_nome}</td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-800">{ticket.aluno_nome || 'N/A'}</div>
                        {ticket.alertas && ticket.alertas.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {ticket.alertas.map((a, i) => (
                              <span key={i} className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider" title={a}>
                                Alerta
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {ticket.priority_level > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                            Alta (P{ticket.priority_level})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {ticket.estado === 'called' ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full text-center animate-pulse">
                              A SER ATENDIDO
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full text-center">
                              EM ESPERA
                            </span>
                            <span className="text-xs text-gray-500 text-center font-medium">
                              {getTempoEspera(ticket.created_at)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {ticket.estado === 'waiting' && (
                          <button 
                            onClick={() => handleAction(ticket.id, 'chamar')}
                            disabled={actionLoading !== null}
                            className={`px-4 py-2 font-bold rounded-lg transition-all ${
                              actionLoading === ticket.id 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                            }`}
                          >
                            {actionLoading === ticket.id ? 'A processar...' : 'Chamar'}
                          </button>
                        )}
                        
                        {ticket.estado === 'called' && (
                          <>
                            <button
                              onClick={() => handleAction(ticket.id, 'finalizar')}
                              disabled={actionLoading !== null}
                              className={`px-3 py-2 font-bold rounded-lg transition-all mr-1 ${
                                actionLoading === ticket.id
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-[#047857] hover:bg-[#065f46] text-white shadow-sm hover:shadow-md'
                              }`}
                            >
                              {actionLoading === ticket.id ? '...' : 'Finalizar'}
                            </button>
                            <button
                              onClick={() => {
                                const mesa = prompt('Mesa de destino:', ticket.mesa_atendimento || '01');
                                if (mesa) {
                                  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${ticket.id}/transferir`, {
                                    method: 'POST',
                                    headers: getHeaders(),
                                    body: JSON.stringify({ mesa }),
                                  }).then(() => fetchFila(true)).catch(() => {});
                                }
                              }}
                              className="px-3 py-2 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              title="Transferir para outra mesa"
                            >
                              ⇄
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 text-center">
          <a href="#" onClick={(e) => { e.preventDefault(); setStatusFilter(''); setError(null); fetchFila(); }} className="text-sm text-[#047857] hover:underline font-medium">
            Ver Fila Completa (todos os estados) →
          </a>
        </div>
      </div>
    </BackofficeLayout>
  );
}
