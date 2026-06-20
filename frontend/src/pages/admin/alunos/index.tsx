import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BackofficeLayout from '../../../components/BackofficeLayout';
import { useToast } from '../../../components/Toast';

interface Student {
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

interface Dashboard {
  total: number;
  ativos: number;
  por_estado: Record<string, number>;
  por_categoria: Record<string, number>;
  recentes: Student[];
}

const ESTADOS_FORMACAO: Record<string, string> = {
  inscrito: 'Inscrito',
  em_formacao: 'Em Formação',
  teorico_concluido: 'Teórico Concluído',
  pratico_concluido: 'Prático Concluído',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  suspenso: 'Suspenso',
};

const CATEGORIAS = ['A', 'B', 'C', 'D', 'BE', 'CE', 'DE'];

const estadoBadge = (estado: string) => {
  const colors: Record<string, string> = {
    inscrito: 'bg-blue-100 text-blue-800',
    em_formacao: 'bg-yellow-100 text-yellow-800',
    teorico_concluido: 'bg-purple-100 text-purple-800',
    pratico_concluido: 'bg-indigo-100 text-indigo-800',
    aprovado: 'bg-green-100 text-green-800',
    reprovado: 'bg-red-100 text-red-800',
    suspenso: 'bg-gray-100 text-gray-800',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
};

export default function AdminAlunosPage() {
  const { addToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const getHeaders = () => {
    const token = localStorage.getItem('backoffice_token');
    const escolaId = localStorage.getItem('backoffice_escola');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (escolaId) headers['x-escola-id'] = escolaId;
    return headers;
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/dashboard`, { headers: getHeaders() });
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
      params.set('limit', String(limit));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students?${params}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Falha ao carregar alunos');
      const data = await res.json();
      setStudents(data.students || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoria, estado, page]);

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja desativar o aluno "${nome}"?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}`, {
        method: 'DELETE', headers: getHeaders()
      });
      if (!res.ok) throw new Error('Falha ao desativar');
      await fetchStudents();
      await fetchDashboard();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <BackofficeLayout activeRoute="/alunos" title="Alunos | Kioske Digital">
      <div className="p-8 max-w-7xl mx-auto w-full">

        {/* Dashboard Cards */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Total Alunos</p>
              <p className="text-3xl font-bold text-[#047857] mt-1">{dashboard.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Ativos</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{dashboard.ativos}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Categorias</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{Object.keys(dashboard.por_categoria).length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Aprovados</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{dashboard.por_estado.aprovado || 0}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Alunos</h2>
          <Link
            href="/alunos/novo"
            className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
          >
            + Novo Aluno
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Buscar por nome, email, nº estudante..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50"
            />
            <select value={categoria} onChange={(e) => { setCategoria(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50">
              <option value="">Todas Categorias</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50">
              <option value="">Todos Estados</option>
              {Object.entries(ESTADOS_FORMACAO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button
              onClick={() => { setSearch(''); setCategoria(''); setEstado(''); setPage(1); }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 text-sm font-bold text-gray-600">Nº</th>
                  <th className="text-left p-4 text-sm font-bold text-gray-600">Nome</th>
                  <th className="text-left p-4 text-sm font-bold text-gray-600">Email</th>
                  <th className="text-left p-4 text-sm font-bold text-gray-600">Telefone</th>
                  <th className="text-left p-4 text-sm font-bold text-gray-600">Categoria</th>
                  <th className="text-left p-4 text-sm font-bold text-gray-600">Estado</th>
                  <th className="text-left p-4 text-sm font-bold text-gray-600">Tickets</th>
                  <th className="text-right p-4 text-sm font-bold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center p-8 text-gray-500">Carregando...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={8} className="text-center p-8 text-gray-500">Nenhum aluno encontrado</td></tr>
                ) : students.map(s => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-mono text-gray-600">{s.numero_estudante}</td>
                    <td className="p-4">
                      <Link href={`/admin/alunos/${s.id}`} className="font-medium text-[#047857] hover:underline">
                        {s.nome}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{s.email || '-'}</td>
                    <td className="p-4 text-sm text-gray-600">{s.telefone || '-'}</td>
                    <td className="p-4 text-sm font-bold text-gray-700">{s.categoria}</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${estadoBadge(s.estado_formacao)}`}>
                        {ESTADOS_FORMACAO[s.estado_formacao] || s.estado_formacao}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{s.total_tickets || 0}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/alunos/${s.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Perfil
                        </Link>
                        <Link href={`/admin/alunos/${s.id}/editar`}
                          className="text-[#047857] hover:text-[#065f46] text-sm font-medium">
                          Editar
                        </Link>
                        <button onClick={() => handleDelete(s.id, s.nome)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium">
                          Desativar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Total: {total} alunos</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50">
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">Página {page} de {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50">
                  Seguinte
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BackofficeLayout>
  );
}
