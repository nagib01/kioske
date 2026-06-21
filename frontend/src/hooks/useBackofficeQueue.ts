import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../components/Toast';
import { apiUrl } from '../lib/api';
import { backofficeHeaders } from '../lib/auth';
import { useWebSocket } from './useWebSocket';

export interface BackofficeTicket {
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

export interface ServicoOption {
  id: string;
  nome: string;
}

const ALERT_LABELS: Record<string, string> = {
  urgencia_menos_10min: 'Urgência: menos de 10 minutos',
  hora_marcada: 'Exame com hora marcada',
  documento_faltando: 'Documentação em falta',
};

/**
 * Owns the receptionist dashboard data: live queue (polling + WebSocket),
 * stats, system alerts, and the ticket actions. Extracted from the old
 * monolithic `backoffice.tsx` (see REFACTOR_PLAN, Phase 3).
 */
export function useBackofficeQueue() {
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<BackofficeTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [alertasSistema, setAlertasSistema] = useState<{ mensagem: string; tipo: string }[]>([]);
  const [stats, setStats] = useState({ atendidosHoje: 0, tempoMedioEspera: 0 });
  const [servicos, setServicos] = useState<ServicoOption[]>([]);
  const [servicosComMesas, setServicosComMesas] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const refreshCountRef = useRef(0);
  const isLoadingRef = useRef(false);

  const headers = () => backofficeHeaders();

  const loadQueue = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    const id = ++refreshCountRef.current;
    try {
      const escolaId = localStorage.getItem('backoffice_escola');
      if (!escolaId) {
        console.error('Nenhuma escola selecionada');
        setAlertasSistema((prev) => [...prev, { mensagem: 'Erro: nenhuma escola configurada.', tipo: 'error' }]);
        return;
      }

      const response = await fetch(apiUrl(`/api/fila/escola/${escolaId}`), { headers: headers() });
      if (id !== refreshCountRef.current) return;
      if (response.ok) {
        const data = await response.json();

        const ticketsMapped: BackofficeTicket[] = (data.tickets || []).map((t: any) => ({
          id: t.id,
          token: t.senha_gerada,
          aluno_nome: t.aluno_nome || `Cliente ${t.senha_gerada}`,
          servico: { nome: t.servico_nome || 'Atendimento' },
          criado_em: t.created_at,
          estado: t.estado || 'waiting',
          posicao_fila: t.posicao_fila || 0,
          prioridade: false,
          prioridade_nivel: t.priority_level || 0,
          alertas: t.alertas || [],
          mesa_atendimento: t.mesa_atendimento || '',
        }));

        setTickets(ticketsMapped);
        if (data.stats) {
          setStats({
            atendidosHoje: data.stats.atendidosHoje || 0,
            tempoMedioEspera: data.stats.tempoMedioEspera || 0,
          });
        }

        const alertasUnicos = new Set<string>();
        ticketsMapped.forEach((t) => {
          (t.alertas || []).forEach((alerta) => {
            alertasUnicos.add(ALERT_LABELS[alerta] || alerta);
          });
        });
        setAlertasSistema(Array.from(alertasUnicos).map((a) => ({ mensagem: String(a), tipo: 'warning' })));
      }
    } catch (err) {
      if (id !== refreshCountRef.current) return;
      console.error('Erro ao carregar fila:', err);
      setAlertasSistema((prev) => [...prev, { mensagem: 'Erro ao conectar à fila em tempo real.', tipo: 'error' }]);
    } finally {
      if (id === refreshCountRef.current) {
        isLoadingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    setToken(localStorage.getItem('backoffice_token'));
  }, []);

  useWebSocket({
    enabled: !!token,
    reconnectKey: token || '',
    register: () => ({
      action: 'register',
      role: 'recepcionista',
      escolaId: localStorage.getItem('backoffice_escola'),
      token,
    }),
    onOpen: () => setWsConnected(true),
    onClose: () => setWsConnected(false),
    onMessage: (msg) => {
      if (
        msg.evento === 'novo_ticket' ||
        msg.evento === 'ticket_chamado' ||
        msg.evento === 'ticket_finalizado' ||
        msg.evento === 'queue_update'
      ) {
        loadQueue();
      }
    },
  });

  useEffect(() => {
    loadQueue();
    const pollingInterval = setInterval(loadQueue, 3000);
    return () => clearInterval(pollingInterval);
  }, [loadQueue]);

  const chamarProximo = useCallback(
    async (mesa: string) => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/fila/escola/${localStorage.getItem('backoffice_escola')}`), {
          headers: headers(),
        });
        if (!res.ok) {
          addToast('Erro ao carregar fila', 'error');
          setLoading(false);
          return;
        }
        const data = await res.json();
        const fila = (data.tickets || []) as BackofficeTicket[];
        const waiting = fila.find((t) => t.estado === 'waiting');
        if (!waiting) {
          addToast('Nenhum cliente aguardando.', 'warning');
          setLoading(false);
          return;
        }
        const response = await fetch(apiUrl(`/api/recepcionista/chamar/${waiting.id}`), {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ mesa }),
        });
        if (response.ok) {
          await loadQueue();
        } else {
          addToast('Erro ao chamar cliente.', 'error');
        }
      } catch (err) {
        addToast('Erro ao chamar cliente.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [loadQueue, addToast],
  );

  const carregarServicos = useCallback(async () => {
    try {
      const [resPublic, resAdmin] = await Promise.all([
        fetch(apiUrl('/api/servicos')),
        fetch(apiUrl('/admin/servicos'), { headers: headers() }).catch(() => null),
      ]);
      if (resPublic.ok) {
        const data = await resPublic.json();
        setServicos(Array.isArray(data) ? data : []);
      }
      if (resAdmin && resAdmin.ok) {
        const data = await resAdmin.json();
        setServicosComMesas(data.servicos || []);
      }
    } catch (err) {
      console.error('Erro ao carregar servicos', err);
    }
  }, []);

  const criarTicket = useCallback(
    async (servicoId: string, alunoNome: string): Promise<boolean> => {
      try {
        const res = await fetch(apiUrl('/api/admin/tickets'), {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ servicoId, alunoNome: alunoNome || undefined }),
        });
        if (res.ok) {
          await loadQueue();
          return true;
        }
        const errData = await res.json();
        addToast(errData.error || 'Erro ao criar senha', 'error');
        return false;
      } catch (err) {
        console.error('Erro ao criar ticket', err);
        addToast('Erro ao criar senha', 'error');
        return false;
      }
    },
    [loadQueue, addToast],
  );

  const transferir = useCallback(
    async (ticketId: string, mesa: string) => {
      try {
        const res = await fetch(apiUrl(`/api/tickets/${ticketId}/transferir`), {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ mesa }),
        });
        if (res.ok) {
          await loadQueue();
        } else {
          const errData = await res.json();
          addToast(errData.error || 'Erro ao transferir', 'error');
        }
      } catch (err) {
        addToast('Erro ao transferir senha', 'error');
      }
    },
    [loadQueue, addToast],
  );

  return {
    tickets,
    loading,
    wsConnected,
    alertasSistema,
    stats,
    servicos,
    servicosComMesas,
    loadQueue,
    chamarProximo,
    carregarServicos,
    criarTicket,
    transferir,
  };
}
