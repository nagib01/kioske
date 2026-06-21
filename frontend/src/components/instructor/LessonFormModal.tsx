import { useEffect, useState } from 'react';
import type { Car, LessonForm, Student } from '../../hooks/useInstructorLessons';

interface LessonFormModalProps {
  editing: any | null;
  students: Student[];
  cars: Car[];
  onClose: () => void;
  onSave: (form: LessonForm, editingId: string | null) => Promise<boolean>;
}

const emptyForm = (): LessonForm => ({
  student_id: '', tipo: 'pratica', data: '', hora_inicio: '', hora_fim: '', car_id: '', summary: '', categoria: '',
});

export default function LessonFormModal({ editing, students, cars, onClose, onSave }: LessonFormModalProps) {
  const editingId = editing?.id ?? null;
  const [form, setForm] = useState<LessonForm>(() =>
    editing
      ? {
          student_id: editing.student_id,
          tipo: editing.tipo,
          data: editing.data,
          hora_inicio: editing.hora_inicio || '',
          hora_fim: editing.hora_fim || '',
          car_id: editing.car_id || '',
          summary: editing.summary || '',
          categoria: editing.categoria || '',
        }
      : emptyForm(),
  );
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const selectedStudent = students.find((s) => s.id === form.student_id);
  const filteredStudents = students.filter(
    (s) =>
      !studentSearch ||
      s.nome.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.numero_estudante.includes(studentSearch),
  );
  const filteredCars = cars.filter((c) => !form.categoria || form.tipo === 'teorica' || c.categoria === form.categoria);

  useEffect(() => {
    if (!showStudentDropdown) return;
    const close = () => setShowStudentDropdown(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showStudentDropdown]);

  const handleSave = async () => {
    const ok = await onSave(form, editingId);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Editar Aula' : 'Nova Aula'}</h3>
        <div className="space-y-3">
          <div className="relative">
            <input type="text" placeholder="Pesquisar aluno..." value={selectedStudent ? `${selectedStudent.nome} (${selectedStudent.numero_estudante})` : studentSearch}
              onFocus={() => { setStudentSearch(''); setShowStudentDropdown(true); }}
              onChange={(e) => { setStudentSearch(e.target.value); setForm({ ...form, student_id: '' }); setShowStudentDropdown(true); }}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
            {showStudentDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="p-3 text-sm text-gray-400">Nenhum aluno encontrado</div>
                ) : filteredStudents.map((s) => (
                  <button key={s.id} type="button"
                    onClick={() => { setForm({ ...form, student_id: s.id, categoria: s.categoria || '' }); setStudentSearch(''); setShowStudentDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors ${form.student_id === s.id ? 'bg-green-50 font-bold text-brand' : 'text-gray-700'}`}>
                    {s.nome} <span className="text-gray-400">({s.numero_estudante})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="border border-gray-300 rounded-lg p-2.5 text-sm">
              <option value="pratica">Prática</option>
              <option value="teorica">Teórica</option>
            </select>
            <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })}
              className="border border-gray-300 rounded-lg p-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="time" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
              className="border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Início" />
            <input type="time" value={form.hora_fim} onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}
              className="border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Fim" />
          </div>
          {form.tipo === 'pratica' && (
            <>
              <input type="text" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="Categoria de carta (ex: B)" readOnly={!!selectedStudent}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-gray-50" />
              <select value={form.car_id} onChange={(e) => setForm({ ...form, car_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                <option value="">Sem carro</option>
                {filteredCars.map((c) => (
                  <option key={c.id} value={c.id}>{c.matricula} - {c.marca} {c.modelo} (Cat. {c.categoria})</option>
                ))}
              </select>
            </>
          )}
          <textarea placeholder="Sumário / Observações" value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" rows={3} />
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 font-bold py-2.5 rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold py-2.5 rounded-lg text-sm">Salvar</button>
        </div>
      </div>
    </div>
  );
}
