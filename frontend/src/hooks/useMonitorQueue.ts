import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../lib/api';
import { useWebSocket } from './useWebSocket';

export interface MonitorTicket {
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

export interface MonitorServico {
  id: string;
  nome: string;
  mesas?: string[];
}

function getEscolaId(): string {
  return (
    localStorage.getItem('backoffice_escola') ||
    process.env.NEXT_PUBLIC_DEFAULT_ESCOLA_ID ||
    '1'
  );
}

/**
 * Owns the monitor (TV) queue data: waiting list, currently-called per table,
 * services, plus the realtime updates (WebSocket + polling) and the call chime.
 * Extracted from the old monolithic `chamadas.tsx` (see REFACTOR_PLAN, Phase 3).
 */
export function useMonitorQueue() {
  const [waitingTickets, setWaitingTickets] = useState<MonitorTicket[]>([]);
  const [currentCalled, setCurrentCalled] = useState<MonitorTicket | null>(null);
  const [calledByTable, setCalledByTable] = useState<Record<string, MonitorTicket>>({});
  const [servicos, setServicos] = useState<MonitorServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playChime = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/chime.mp3');
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  };

  const processQueueData = useCallback((tickets: MonitorTicket[]) => {
    const waiting = tickets.filter((t) => t.estado === 'waiting');
    const called = tickets.filter((t) => t.estado === 'called' && t.mesa_atendimento);

    const sortedWaiting = [...waiting].sort((a, b) => {
      if (b.prioridade_nivel !== a.prioridade_nivel) return b.prioridade_nivel - a.prioridade_nivel;
      return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime();
    });
    setWaitingTickets(sortedWaiting);

    const tableMap: Record<string, MonitorTicket> = {};
    for (const t of called) {
      const key = t.mesa_atendimento!;
      if (!tableMap[key] || new Date(t.updated_at) > new Date(tableMap[key].updated_at)) {
        tableMap[key] = t;
      }
    }
    setCalledByTable(tableMap);

    if (called.length > 0) {
      const sortedCalled = [...called].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
      setCurrentCalled(sortedCalled[0]);
    } else {
      setCurrentCalled(null);
    }
  }, []);

  const carregarFila = useCallback(async () => {
    try {
      const escolaId = getEscolaId();
      const res = await fetch(apiUrl(`/api/fila?escolaId=${encodeURIComponent(escolaId)}`));
      if (!res.ok) throw new Error('Falha ao carregar fila');
      const data: MonitorTicket[] = await res.json();
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
      const escolaId = getEscolaId();
      const res = await fetch(apiUrl(`/api/servicos?escolaId=${encodeURIComponent(escolaId)}`));
      if (res.ok) {
        const data = await res.json();
        setServicos(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    carregarServicos().then(() => carregarFila());
    const pollingInterval = setInterval(() => carregarFila(), 5000);
    return () => clearInterval(pollingInterval);
  }, [carregarFila, carregarServicos]);

  useWebSocket({
    register: () => ({ action: 'register', role: 'monitor', escolaId: getEscolaId() }),
    onMessage: (msg) => {
      if (msg.evento === 'ticket_chamado') {
        const ticket = msg.dados as MonitorTicket;
        setCurrentCalled(ticket);
        if (ticket.mesa_atendimento) {
          setCalledByTable((prev) => ({ ...prev, [ticket.mesa_atendimento!]: ticket }));
        }
        playChime();
      }
      if (msg.evento === 'novo_ticket' || msg.evento === 'ticket_finalizado') {
        carregarFila();
      }
    },
  });

  return { waitingTickets, currentCalled, calledByTable, servicos, loading, error };
}
