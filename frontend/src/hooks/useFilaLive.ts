import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { apiUrl } from '../lib/api';
import { backofficeHeaders } from '../lib/auth';
import { useWebSocket } from './useWebSocket';

export interface FilaTicket {
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

export interface FilaStats {
  atendidosHoje: number;
  tempoMedioEspera: number;
}

const REFRESH_EVENTS = ['novo_ticket', 'ticket_chamado', 'ticket_finalizado', 'queue_update'];

/**
 * Owns the live-queue admin data: tickets, stats, polling + WebSocket, and the
 * call/finish/transfer actions. Extracted from the old monolithic
 * `admin/fila.tsx` (see REFACTOR_PLAN, Phase 3).
 */
export function useFilaLive() {
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<FilaTicket[]>([]);
  const [stats, setStats] = useState<FilaStats>({ atendidosHoje: 0, tempoMedioEspera: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [wsConnected, setWsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const headers = () => backofficeHeaders({ escola: true });

  const fetchFila = useCallback(
    async (isPolling = false) => {
      const escolaId = localStorage.getItem('backoffice_escola') || '1';

      if (!isPolling) setLoading(true);

      try {
        const url =
          statusFilter === 'finished'
            ? apiUrl(`/api/admin/fila/complete?escolaId=${escolaId}&status=finished&limit=100`)
            : apiUrl(`/api/fila/escola/${escolaId}`);
        const res = await fetch(url, { headers: headers() });

        if (!res.ok) {
          if (res.status === 401) throw new Error('Sessão inválida. Por favor, faça login novamente.');
          throw new Error('Falha ao carregar fila');
        }

        const data = await res.json();
        if (statusFilter === 'finished') {
          setTickets(data.tickets || []);
        } else {
          setTickets(data.tickets || []);
          if (data.stats) setStats(data.stats);
        }
        setError(null);
      } catch (err: any) {
        if (!isPolling) setError(err.message || 'Erro desconhecido');
        else addToast(err.message || 'Erro ao carregar fila', 'error');
      } finally {
        if (!isPolling) setLoading(false);
      }
    },
    [statusFilter, addToast],
  );

  useEffect(() => {
    setToken(localStorage.getItem('backoffice_token'));
  }, []);

  useWebSocket({
    enabled: !!token,
    reconnectKey: token || '',
    register: () => ({
      action: 'register',
      role: 'recepcionista',
      escolaId: localStorage.getItem('backoffice_escola') || '1',
      token,
    }),
    onOpen: () => setWsConnected(true),
    onClose: () => setWsConnected(false),
    onMessage: (msg) => {
      if (typeof msg.evento === 'string' && REFRESH_EVENTS.includes(msg.evento)) {
        fetchFila(true);
      }
    },
  });

  useEffect(() => {
    fetchFila();
    const interval = setInterval(() => fetchFila(true), 5000);
    return () => clearInterval(interval);
  }, [fetchFila]);

  const transferir = async (ticketId: string, mesa: string) => {
    try {
      const res = await fetch(apiUrl(`/api/tickets/${ticketId}/transferir`), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ mesa }),
      });
      if (!res.ok) throw new Error('Falha ao transferir ticket');
      await fetchFila(true);
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const chamar = async (ticketId: string, mesa: string) => {
    setActionLoading(ticketId);
    try {
      const res = await fetch(apiUrl(`/api/recepcionista/chamar/${ticketId}`), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ mesa }),
      });
      if (!res.ok) throw new Error('Falha ao chamar ticket');
      await fetchFila(true);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const finalizar = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      const res = await fetch(apiUrl(`/api/recepcionista/finalizar/${ticketId}`), {
        method: 'POST',
        headers: headers(),
        body: '{}',
      });
      if (!res.ok) throw new Error('Falha ao finalizar ticket');
      await fetchFila(true);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return {
    tickets,
    stats,
    loading,
    error,
    actionLoading,
    statusFilter,
    setStatusFilter,
    wsConnected,
    fetchFila,
    chamar,
    finalizar,
    transferir,
  };
}
