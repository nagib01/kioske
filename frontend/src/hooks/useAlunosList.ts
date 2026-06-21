import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { apiUrl } from '../lib/api';
import { backofficeHeaders } from '../lib/auth';

export interface AlunoListItem {
  id: string;
  numero_estudante: string;
  nome: string;
  email?: string;
  telefone?: string;
  categoria: string;
  estado_formacao: string;
  ativo: boolean;
  created_at: string;
  total_tickets?: number;
}

export interface AlunosDashboardData {
  total: number;
  ativos: number;
  por_estado: Record<string, number>;
  por_categoria: Record<string, number>;
  recentes: AlunoListItem[];
}

const LIMIT = 20;

/**
 * Owns the students list: dashboard stats, paginated/filtered list, and the
 * deactivate action. Extracted from the old monolithic `admin/alunos/index.tsx`
 * (see REFACTOR_PLAN, Phase 3).
 */
export function useAlunosList() {
  const { addToast } = useToast();
  const [students, setStudents] = useState<AlunoListItem[]>([]);
  const [dashboard, setDashboard] = useState<AlunosDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const headers = () => backofficeHeaders({ escola: true });

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/admin/students/dashboard'), { headers: headers() });
      if (res.ok) setDashboard(await res.json());
    } catch {}
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoria) params.set('categoria', categoria);
      if (estado) params.set('estado_formacao', estado);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));

      const res = await fetch(apiUrl(`/admin/students?${params}`), { headers: headers() });
      if (!res.ok) throw new Error('Falha ao carregar alunos');
      const data = await res.json();
      setStudents(data.students || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoria, estado, page, addToast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const deleteStudent = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja desativar o aluno "${nome}"?`)) return;
    try {
      const res = await fetch(apiUrl(`/admin/students/${id}`), { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error('Falha ao desativar');
      await fetchStudents();
      await fetchDashboard();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const onSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const onCategoriaChange = (v: string) => { setCategoria(v); setPage(1); };
  const onEstadoChange = (v: string) => { setEstado(v); setPage(1); };
  const clearFilters = () => { setSearch(''); setCategoria(''); setEstado(''); setPage(1); };
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const nextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  return {
    students,
    dashboard,
    loading,
    search,
    categoria,
    estado,
    page,
    total,
    totalPages,
    onSearchChange,
    onCategoriaChange,
    onEstadoChange,
    clearFilters,
    prevPage,
    nextPage,
    deleteStudent,
  };
}
