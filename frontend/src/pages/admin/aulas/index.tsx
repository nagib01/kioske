import { useState, useEffect } from 'react';
import BackofficeLayout from '../../../components/BackofficeLayout';

type Lesson = {
  id: string;
  student_nome: string;
  student_numero_estudante: string;
  instructor_nome?: string;
  car_matricula?: string;
  tipo: string;
  data: string;
  hora_inicio?: string;
  hora_fim?: string;
  summary?: string;
  status: string;
};

export default function AdminAulas() {
  const api = (path: string) => `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const limit = 20;

  const fetchLessons = async () => {
    setLoading(true);
    const token = localStorage.getItem('backoffice_token');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (dataInicio) params.set('data_inicio', dataInicio);
    if (dataFim) params.set('data_fim', dataFim);
    params.set('page', String(page));
    params.set('limit', String(limit));

    const res = await fetch(api(`/admin/lessons?${params}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setLessons(data.lessons);
      setTotal(data.total);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLessons(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLessons();
  };

  const exportCsv = () => {
    const token = localStorage.getItem('backoffice_token');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (dataInicio) params.set('data_inicio', dataInicio);
    if (dataFim) params.set('data_fim', dataFim);
    window.open(api(`/admin/lessons/export?${params}`), '_blank');
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      agendada: 'bg-blue-100 text-blue-800',
      em_curso: 'bg-yellow-100 text-yellow-800',
      concluida: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      agendada: 'Agendada',
      em_curso: 'Em Curso',
      concluida: 'Concluída',
      cancelada: 'Cancelada',
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <BackofficeLayout activeRoute="/admin/aulas" title="Aulas | Backoffice">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Registo de Aulas</h1>
          <button onClick={exportCsv} className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar CSV
          </button>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input type="text" placeholder="Pesquisar (aluno, instrutor, matrícula)" value={search}
              onChange={e => setSearch(e.target.value)} className="border border-gray-300 rounded-lg p-2.5 text-sm col-span-2" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg p-2.5 text-sm">
              <option value="">Todos os estados</option>
              <option value="agendada">Agendada</option>
              <option value="em_curso">Em Curso</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
              className="border border-gray-300 rounded-lg p-2.5 text-sm" />
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
              className="border border-gray-300 rounded-lg p-2.5 text-sm" />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="bg-[#047857] text-white font-bold py-2 px-6 rounded-lg text-sm">Filtrar</button>
            <button type="button" onClick={() => { setSearch(''); setStatusFilter(''); setDataInicio(''); setDataFim(''); setPage(1); }}
              className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm">Limpar</button>
          </div>
        </form>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-3 text-xs font-bold text-gray-600">Data</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Horário</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Aluno</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Instrutor</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Carro</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Tipo</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Status</th>
                <th className="text-right p-3 text-xs font-bold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center p-6 text-gray-500 text-sm">A carregar...</td></tr>
              ) : lessons.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-6 text-gray-500 text-sm">Nenhuma aula encontrada</td></tr>
              ) : lessons.map(l => (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-700">{new Date(l.data).toLocaleDateString('pt-PT')}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {l.hora_inicio ? l.hora_inicio.substring(0, 5) : '-'}{l.hora_fim ? ` - ${l.hora_fim.substring(0, 5)}` : ''}
                  </td>
                  <td className="p-3 text-sm text-gray-600">{l.student_nome}</td>
                  <td className="p-3 text-sm text-gray-600">{l.instructor_nome || '-'}</td>
                  <td className="p-3 text-sm text-gray-600">{l.car_matricula || '-'}</td>
                  <td className="p-3 text-sm">
                    <span className={`font-bold ${l.tipo === 'pratica' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {l.tipo === 'pratica' ? 'Prática' : 'Teórica'}
                    </span>
                  </td>
                  <td className="p-3">{statusBadge(l.status)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setSelectedLesson(l)} className="text-[#047857] hover:text-[#065f46] text-xs font-medium">
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border text-sm disabled:opacity-50">Anterior</button>
            <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded border text-sm disabled:opacity-50">Seguinte</button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedLesson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLesson(null)}>
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Detalhes da Aula</h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Data:</span><span className="font-medium">{new Date(selectedLesson.data).toLocaleDateString('pt-PT')}</span>
                  <span className="text-gray-500">Horário:</span><span className="font-medium">{selectedLesson.hora_inicio?.substring(0,5)} - {selectedLesson.hora_fim?.substring(0,5)}</span>
                  <span className="text-gray-500">Tipo:</span><span className="font-medium">{selectedLesson.tipo === 'pratica' ? 'Prática' : 'Teórica'}</span>
                  <span className="text-gray-500">Status:</span><span>{statusBadge(selectedLesson.status)}</span>
                  <span className="text-gray-500">Aluno:</span><span className="font-medium">{selectedLesson.student_nome}</span>
                  <span className="text-gray-500">Nº Estudante:</span><span className="font-medium">{selectedLesson.student_numero_estudante}</span>
                  <span className="text-gray-500">Instrutor:</span><span className="font-medium">{selectedLesson.instructor_nome || '-'}</span>
                  <span className="text-gray-500">Carro:</span><span className="font-medium">{selectedLesson.car_matricula || '-'}</span>
                </div>
                {selectedLesson.summary && (
                  <div>
                    <span className="text-gray-500 block mb-1">Sumário:</span>
                    <p className="bg-gray-50 rounded-lg p-3 text-gray-700">{selectedLesson.summary}</p>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedLesson(null)} className="mt-6 w-full bg-gray-200 hover:bg-gray-300 font-bold py-2.5 rounded-lg text-sm">Fechar</button>
            </div>
          </div>
        )}
      </div>
    </BackofficeLayout>
  );
}
