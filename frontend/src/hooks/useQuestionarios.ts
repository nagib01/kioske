import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { apiUrl } from '../lib/api';
import { backofficeHeaders } from '../lib/auth';

export interface Opcao {
  id?: string;
  label: string;
  value: string;
  ordem: number;
  ativo?: boolean;
}

export interface Pergunta {
  id: string;
  servico_id: string | null;
  texto: string;
  tipo: 'single_choice' | 'yes_no';
  obrigatoria: boolean;
  ordem: number;
  ativo: boolean;
  opcoes: Opcao[];
}

export interface Servico {
  id: string;
  nome: string;
}

export interface PerguntaPayload {
  texto: string;
  servico_id: string | null;
  tipo: 'single_choice' | 'yes_no';
  obrigatoria: boolean;
  ordem: number;
  ativo: boolean;
  opcoes: Opcao[];
}

/**
 * Owns the triage-questionnaire admin data + CRUD (questions and their options).
 * Extracted from the old monolithic `admin/questionarios.tsx`
 * (see REFACTOR_PLAN, Phase 3).
 */
export function useQuestionarios() {
  const { addToast } = useToast();
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = () => backofficeHeaders({ escola: true });

  const fetchDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resPerguntas, resServicos] = await Promise.all([
        fetch(apiUrl('/admin/perguntas-triagem'), { headers: headers() }),
        fetch(apiUrl('/admin/servicos'), { headers: headers() }),
      ]);

      if (!resPerguntas.ok) throw new Error('Falha ao carregar perguntas');
      if (!resServicos.ok) throw new Error('Falha ao carregar serviços');

      const dataPerguntas = await resPerguntas.json();
      const dataServicos = await resServicos.json();

      setPerguntas(dataPerguntas.perguntas || []);
      setServicos(dataServicos.servicos || []);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const savePergunta = async (editingId: string | null, payload: PerguntaPayload): Promise<boolean> => {
    setError(null);
    try {
      const url = editingId
        ? apiUrl(`/admin/perguntas-triagem/${editingId}`)
        : apiUrl('/admin/perguntas-triagem');
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Falha ao salvar pergunta');

      await fetchDados();
      return true;
    } catch (err: any) {
      addToast(err.message, 'error');
      return false;
    }
  };

  const deletePergunta = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja desativar esta pergunta?')) return;
    try {
      const res = await fetch(apiUrl(`/admin/perguntas-triagem/${id}`), {
        method: 'DELETE',
        headers: headers(),
      });
      if (!res.ok) throw new Error('Falha ao desativar pergunta');
      await fetchDados();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  return { perguntas, servicos, loading, error, savePergunta, deletePergunta };
}
