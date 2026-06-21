import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiUrl } from '../lib/api';
import { useRealtimeQueue } from './useRealtimeQueue';
import type { PerguntaTriagem, RespostaTriagem } from '../components/TriageForm';

export interface Servico {
  id: string;
  nome: string;
  tempo_medio_atendimento: number;
}

export interface TicketData {
  id: string;
  token: string;
  codigo_senha: string;
  posicao_fila: number;
  prioridade: boolean;
  prioridade_nivel: string;
  estado: string;
  alertas: string[];
  criado_em: string;
  tempo_estimado_min: number;
  servico_id: string;
  servico?: { nome: string };
  aluno_token: string;
  qrCode?: string;
}

export type Fase = 'servico' | 'triagem' | 'senha';

/**
 * Owns the kiosk BYOD/triage flow: service selection -> triage questions ->
 * issued ticket, plus the realtime queue updates. Extracted from the old
 * monolithic `aluno.tsx` (see REFACTOR_PLAN, Phase 3).
 */
export function useKioskTriage() {
  const [fase, setFase] = useState<Fase>('servico');
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [perguntas, setPerguntas] = useState<PerguntaTriagem[]>([]);
  const [, setCarregandoPerguntas] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [carregandoTriagem, setCarregandoTriagem] = useState(false);
  const [escolaId, setEscolaId] = useState<string>('');
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loggedStudentId, setLoggedStudentId] = useState<string | null>(null);
  const [kioskToken, setKioskToken] = useState<string | null>(null);

  const router = useRouter();
  const { queueData, isConnected } = useRealtimeQueue(token);

  const fetchTicketData = async (alunoToken: string) => {
    try {
      const res = await fetch(apiUrl(`/api/tickets/${alunoToken}`));
      if (res.ok) {
        const data = await res.json();
        setTicketData(data);
        setFase('senha');
      } else {
        localStorage.removeItem('kioske_token');
        setFase('servico');
      }
    } catch (e) {
      console.error('Erro ao buscar ticket', e);
    }
  };

  useEffect(() => {
    fetch(apiUrl('/api/kiosk/token'))
      .then((r) => r.json())
      .then((d) => {
        if (d.token) setKioskToken(d.token);
      })
      .catch(() => {});

    const savedEscolaId = localStorage.getItem('kioske_escolaId');
    const savedToken = localStorage.getItem('kioske_token');
    const savedStudent = localStorage.getItem('kioske_student');

    if (savedEscolaId) {
      setEscolaId(savedEscolaId);
    } else if (process.env.NEXT_PUBLIC_DEFAULT_ESCOLA_ID) {
      const envEscolaId = process.env.NEXT_PUBLIC_DEFAULT_ESCOLA_ID;
      setEscolaId(envEscolaId);
      localStorage.setItem('kioske_escolaId', envEscolaId);
    }

    if (savedStudent) {
      try {
        const parsed = JSON.parse(savedStudent);
        if (parsed.id) setLoggedStudentId(parsed.id);
      } catch {}
    }

    if (savedToken) {
      setToken(savedToken);
      fetchTicketData(savedToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (router.isReady && servicos.length > 0) {
      const { servicoId } = router.query;
      if (servicoId) {
        const servico = servicos.find((s) => s.id === servicoId);
        if (servico) {
          handleSelecionarServico(servico);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, servicos, router.query]);

  useEffect(() => {
    if (queueData && ticketData) {
      setTicketData((prev) => ({
        ...prev!,
        token: queueData.token || prev!.token,
        posicao_fila: queueData.posicao_fila !== undefined ? queueData.posicao_fila : prev!.posicao_fila,
        estado: queueData.estado || prev!.estado,
        tempo_estimado_min: Math.max(
          ((queueData.posicao_fila || 1) - 1) * (servicoSelecionado?.tempo_medio_atendimento || 10),
          0,
        ),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueData, servicoSelecionado]);

  const handleSelecionarServico = async (servico: Servico) => {
    setServicoSelecionado(servico);
    setCarregandoPerguntas(true);
    try {
      const res = await fetch(apiUrl(`/api/triagem/perguntas/${servico.id}`));
      const data = await res.json();
      setPerguntas(data.perguntas || []);
      localStorage.setItem('kioske_servicoId', servico.id);
      setFase('triagem');
    } catch (e) {
      console.error('Erro ao carregar perguntas', e);
    } finally {
      setCarregandoPerguntas(false);
    }
  };

  const handleSubmitTriagem = async (respostas: RespostaTriagem[]) => {
    if (!servicoSelecionado) return;
    setCarregandoTriagem(true);
    try {
      let activeToken = kioskToken;
      const trySubmit = async (tk: string | null) => {
        const res = await fetch(apiUrl('/api/triagem/finalizar'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            servicoId: servicoSelecionado.id,
            respostas,
            escolaId,
            studentId: loggedStudentId,
            kioskToken: tk,
          }),
        });
        if (!res.ok && res.status === 403 && tk) {
          const refresh = await fetch(apiUrl('/api/kiosk/token'));
          const refreshData = await refresh.json();
          if (refreshData.token) {
            activeToken = refreshData.token;
            setKioskToken(activeToken);
            return await fetch(apiUrl('/api/triagem/finalizar'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                servicoId: servicoSelecionado.id,
                respostas,
                escolaId,
                studentId: loggedStudentId,
                kioskToken: activeToken,
              }),
            });
          }
        }
        return res;
      };
      const res = await trySubmit(activeToken);
      const data = await res.json();
      if (data.ticket) {
        localStorage.setItem('kioske_token', data.ticket.aluno_token);
        setToken(data.ticket.aluno_token);
        setTicketData(data.ticket);
        setFase('senha');
      } else if (data.error) {
        console.error('Erro ao criar ticket', data.error);
      }
    } catch (e) {
      console.error('Erro ao criar ticket', e);
    } finally {
      setCarregandoTriagem(false);
    }
  };

  const handleReimprimir = async () => {
    if (!ticketData?.id) return;
    try {
      const res = await fetch(apiUrl(`/api/tickets/${ticketData.id}/reprint`));
      if (res.ok) {
        const data = await res.json();
        if (data.ticket?.qrCode) {
          setTicketData((prev) => (prev ? { ...prev, qrCode: data.ticket.qrCode } : prev));
        }
      }
    } catch (e) {
      console.error('Erro ao reimprimir', e);
    }
  };

  const handleCancelar = () => {
    localStorage.removeItem('kioske_token');
    setToken(null);
    setFase('servico');
    setServicoSelecionado(null);
    setTicketData(null);
  };

  const voltarParaServico = () => {
    setFase('servico');
    setServicoSelecionado(null);
    setPerguntas([]);
  };

  return {
    fase,
    servicoSelecionado,
    perguntas,
    carregandoTriagem,
    ticketData,
    isConnected,
    loggedStudentId,
    setServicos,
    handleSelecionarServico,
    handleSubmitTriagem,
    handleReimprimir,
    handleCancelar,
    voltarParaServico,
  };
}
