import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { apiUrl } from '../lib/api';
import { backofficeHeaders } from '../lib/auth';

export interface Servico {
  id: string;
  nome: string;
  tempo_medio_atendimento: number;
  codigo_prefixo: string;
  prioridade_base: number;
  ativo: boolean;
  mesa_padrao: string;
  mesas?: string[];
}

export interface ServicoPayload {
  nome: string;
  codigo_prefixo: string;
  tempo_medio_atendimento: number;
  prioridade_base: number;
  mesa_padrao: string;
  mesas: string[];
  ativo: boolean;
}

/**
 * Owns the admin services data + CRUD. Extracted from the old monolithic
 * `admin/servicos.tsx` (see REFACTOR_PLAN, Phase 3).
 */
export function useServicos() {
  const { addToast } = useToast();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = () => backofficeHeaders({ escola: true });

  const fetchServicos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/admin/servicos'), { headers: headers() });
      if (!res.ok) throw new Error('Falha ao carregar serviços');
      const data = await res.json();
      setServicos(data.servicos || []);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicos();
  }, [fetchServicos]);

  const saveServico = async (editingId: string | null, payload: ServicoPayload): Promise<boolean> => {
    setError(null);
    try {
      const url = editingId ? apiUrl(`/admin/servicos/${editingId}`) : apiUrl('/admin/servicos');
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Erro ${res.status}: Falha ao salvar serviço`);
      }

      await fetchServicos();
      return true;
    } catch (err: any) {
      addToast(err.message, 'error');
      return false;
    }
  };

  const deleteServico = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja desativar este serviço?')) return;
    try {
      const res = await fetch(apiUrl(`/admin/servicos/${id}`), {
        method: 'DELETE',
        headers: headers(),
      });
      if (!res.ok) throw new Error('Falha ao desativar serviço');
      await fetchServicos();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  return { servicos, loading, error, saveServico, deleteServico };
}
