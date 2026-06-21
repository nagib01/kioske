import { useState, useEffect } from 'react';
import InstructorLayout from '../../components/InstructorLayout';
import { useToast } from '../../components/Toast';
import { apiUrl as api } from '../../lib/api';

type Student = { id: string; nome: string; numero_estudante: string; categoria: string };
type Car = { id: string; matricula: string; marca: string; modelo: string; categoria: string };

export default function InstructorAulas() {
  const { addToast } = useToast();
  const [lessons, setLessons] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    student_id: '', tipo: 'pratica', data: '', hora_inicio: '', hora_fim: '', car_id: '', summary: '', categoria: '',
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const selectedStudent = students.find(s => s.id === form.student_id);
  const filteredStudents = students.filter(s =>
    !studentSearch || s.nome.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.numero_estudante.includes(studentSearch)
  );
  const filteredCars = cars.filter(c => !form.categoria || form.tipo === 'teorica' || c.categoria === form.categoria);

  const token = typeof window !== 'undefined' ? localStorage.getItem('backoffice_token') : null;

  const fetchLessons = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(api(`/api/instructor/lessons?${params}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setLessons(await res.json());
    setLoading(false);
  };

  const fetchStudents = async () => {
    const res = await fetch(api('/api/instructor/students'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setStudents(data || []);
    }
  };

  const fetchCars = async () => {
    const res = await fetch(api('/api/instructor/cars'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setCars(await res.json());
  };

  useEffect(() => {
    fetchLessons();
    fetchStudents();
    fetchCars();
  }, []);

  useEffect(() => { fetchLessons(); }, [statusFilter]);

  useEffect(() => {
    if (!showStudentDropdown) return;
    const close = () => setShowStudentDropdown(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showStudentDropdown]);

  const resetForm = () => {
    setForm({ student_id: '', tipo: 'pratica', data: '', hora_inicio: '', hora_fim: '', car_id: '', summary: '', categoria: '' });
    setStudentSearch('');
    setShowStudentDropdown(false);
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (lesson: any) => {
    setForm({
      student_id: lesson.student_id,
      tipo: lesson.tipo,
      data: lesson.data,
      hora_inicio: lesson.hora_inicio || '',
      hora_fim: lesson.hora_fim || '',
      car_id: lesson.car_id || '',
      summary: lesson.summary || '',
      categoria: lesson.categoria || '',
    });
    setEditingId(lesson.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    const base = api('/api/instructor/lessons');
    const url = editingId ? `${base}/${editingId}` : base;
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      resetForm();
      fetchLessons();
    } else {
      const err = await res.json();
      addToast(err.error || 'Erro ao salvar aula', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja remover esta aula?')) return;
    const res = await fetch(api(`/api/instructor/lessons/${id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchLessons();
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(api(`/api/instructor/lessons/${id}`), {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchLessons();
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      agendada: 'bg-blue-100 text-blue-800',
      em_curso: 'bg-yellow-100 text-yellow-800',
      concluida: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      agendada: 'Agendada', em_curso: 'Em Curso', concluida: 'Concluída', cancelada: 'Cancelada',
    };
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{labels[status] || status}</span>;
  };

  return (
    <InstructorLayout title="Minhas Aulas | Instrutor">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Minhas Aulas</h1>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
            + Nova Aula
          </button>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg p-2.5 text-sm">
            <option value="">Todos os estados</option>
            <option value="agendada">Agendada</option>
            <option value="em_curso">Em Curso</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {/* Lessons Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-3 text-xs font-bold text-gray-600">Data</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Horário</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Aluno</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Carro</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Tipo</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Status</th>
                <th className="text-right p-3 text-xs font-bold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-500 text-sm">A carregar...</td></tr>
              ) : lessons.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-500 text-sm">Nenhuma aula encontrada</td></tr>
              ) : lessons.map(l => (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-700">{new Date(l.data).toLocaleDateString('pt-PT')}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {l.hora_inicio?.substring(0,5)}{l.hora_fim ? ` - ${l.hora_fim.substring(0,5)}` : ''}
                  </td>
                  <td className="p-3 text-sm text-gray-600 font-medium">{l.student_nome}</td>
                  <td className="p-3 text-sm text-gray-600">{l.car_matricula || '-'}</td>
                  <td className="p-3 text-sm">
                    <span className={`font-bold ${l.tipo === 'pratica' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {l.tipo === 'pratica' ? 'Prática' : 'Teórica'}
                    </span>
                  </td>
                  <td className="p-3">{statusBadge(l.status)}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {l.status === 'agendada' && (
                        <>
                          <button onClick={() => updateStatus(l.id, 'em_curso')} className="text-yellow-600 hover:text-yellow-800 text-xs font-medium px-1">Iniciar</button>
                          <button onClick={() => openEdit(l)} className="text-brand hover:text-brand-dark text-xs font-medium px-1">Editar</button>
                        </>
                      )}
                      {l.status === 'em_curso' && (
                        <button onClick={() => updateStatus(l.id, 'concluida')} className="text-green-600 hover:text-green-800 text-xs font-medium px-1">Concluir</button>
                      )}
                      {(l.status === 'agendada' || l.status === 'concluida') && (
                        <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:text-red-800 text-xs font-medium px-1">Remover</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Editar Aula' : 'Nova Aula'}</h3>
              <div className="space-y-3">
                <div className="relative">
                  <input type="text" placeholder="Pesquisar aluno..." value={selectedStudent ? `${selectedStudent.nome} (${selectedStudent.numero_estudante})` : studentSearch}
                    onFocus={() => { setStudentSearch(''); setShowStudentDropdown(true); }}
                    onChange={e => { setStudentSearch(e.target.value); setForm({...form, student_id: ''}); setShowStudentDropdown(true); }}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                  {showStudentDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredStudents.length === 0 ? (
                        <div className="p-3 text-sm text-gray-400">Nenhum aluno encontrado</div>
                      ) : filteredStudents.map(s => (
                        <button key={s.id} type="button"
                          onClick={() => { setForm({...form, student_id: s.id, categoria: s.categoria || ''}); setStudentSearch(''); setShowStudentDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors ${form.student_id === s.id ? 'bg-green-50 font-bold text-brand' : 'text-gray-700'}`}>
                          {s.nome} <span className="text-gray-400">({s.numero_estudante})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                    className="border border-gray-300 rounded-lg p-2.5 text-sm">
                    <option value="pratica">Prática</option>
                    <option value="teorica">Teórica</option>
                  </select>
                  <input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})}
                    className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="time" value={form.hora_inicio} onChange={e => setForm({...form, hora_inicio: e.target.value})}
                    className="border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Início" />
                  <input type="time" value={form.hora_fim} onChange={e => setForm({...form, hora_fim: e.target.value})}
                    className="border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Fim" />
                </div>
                {form.tipo === 'pratica' && (
                  <>
                    <input type="text" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                      placeholder="Categoria de carta (ex: B)" readOnly={!!selectedStudent}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-gray-50" />
                    <select value={form.car_id} onChange={e => setForm({...form, car_id: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                      <option value="">Sem carro</option>
                      {filteredCars.map(c => (
                        <option key={c.id} value={c.id}>{c.matricula} - {c.marca} {c.modelo} (Cat. {c.categoria})</option>
                      ))}
                    </select>
                  </>
                )}
                <textarea placeholder="Sumário / Observações" value={form.summary}
                  onChange={e => setForm({...form, summary: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" rows={3} />
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 font-bold py-2.5 rounded-lg text-sm">Cancelar</button>
                <button onClick={handleSave} className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold py-2.5 rounded-lg text-sm">Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
