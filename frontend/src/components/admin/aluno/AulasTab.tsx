import { useState } from 'react';
import type { NewLesson } from '../../../hooks/useStudentProfile';

interface AulasTabProps {
  lessons: any[];
  cars: any[];
  onAdd: (lesson: NewLesson) => Promise<boolean>;
  onDelete: (lessonId: string) => void;
}

const emptyLesson = (): NewLesson => ({
  tipo: 'pratica',
  data: new Date().toISOString().split('T')[0],
  hora_inicio: '',
  hora_fim: '',
  car_id: '',
  summary: '',
  status: 'agendada',
});

export default function AulasTab({ lessons, cars, onAdd, onDelete }: AulasTabProps) {
  const [newLesson, setNewLesson] = useState<NewLesson>(emptyLesson);

  const handleAdd = async () => {
    const ok = await onAdd(newLesson);
    if (ok) setNewLesson(emptyLesson());
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Add lesson form */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h4 className="font-bold text-sm text-gray-700 mb-3">Registar Nova Aula</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={newLesson.tipo} onChange={(e) => setNewLesson({ ...newLesson, tipo: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm">
            <option value="pratica">Prática</option>
            <option value="teorica">Teórica</option>
          </select>
          <input type="date" value={newLesson.data} onChange={(e) => setNewLesson({ ...newLesson, data: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm" />
          <input type="time" placeholder="Início" value={newLesson.hora_inicio}
            onChange={(e) => setNewLesson({ ...newLesson, hora_inicio: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm" />
          <input type="time" placeholder="Fim" value={newLesson.hora_fim}
            onChange={(e) => setNewLesson({ ...newLesson, hora_fim: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm" />
          <select value={newLesson.car_id} onChange={(e) => setNewLesson({ ...newLesson, car_id: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm">
            <option value="">Sem carro</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>{c.matricula} - {c.marca} {c.modelo}</option>
            ))}
          </select>
          <input type="text" placeholder="Sumário" value={newLesson.summary}
            onChange={(e) => setNewLesson({ ...newLesson, summary: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm col-span-2" />
          <select value={newLesson.status} onChange={(e) => setNewLesson({ ...newLesson, status: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm">
            <option value="agendada">Agendada</option>
            <option value="em_curso">Em Curso</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <button onClick={handleAdd}
            className="bg-brand hover:bg-brand-dark text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors">
            Adicionar
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-xs font-bold text-gray-600">Tipo</th>
              <th className="text-left p-3 text-xs font-bold text-gray-600">Data</th>
              <th className="text-left p-3 text-xs font-bold text-gray-600">Horário</th>
              <th className="text-left p-3 text-xs font-bold text-gray-600">Carro</th>
              <th className="text-left p-3 text-xs font-bold text-gray-600">Sumário</th>
              <th className="text-left p-3 text-xs font-bold text-gray-600">Estado</th>
              <th className="text-right p-3 text-xs font-bold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lessons.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-6 text-gray-500 text-sm">Nenhuma aula registada</td></tr>
            ) : lessons.map((l: any) => {
              const statusColors: Record<string, string> = {
                agendada: 'bg-blue-100 text-blue-800',
                em_curso: 'bg-yellow-100 text-yellow-800',
                concluida: 'bg-green-100 text-green-800',
                cancelada: 'bg-red-100 text-red-800',
              };
              const statusLabels: Record<string, string> = {
                agendada: 'Agendada', em_curso: 'Em Curso', concluida: 'Concluída', cancelada: 'Cancelada',
              };
              return (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-sm">
                    <span className={`font-bold ${l.tipo === 'pratica' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {l.tipo === 'pratica' ? 'Prática' : 'Teórica'}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-700">{new Date(l.data).toLocaleDateString('pt-PT')}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {l.hora_inicio ? l.hora_inicio.substring(0, 5) : '-'}{l.hora_fim ? ` - ${l.hora_fim.substring(0, 5)}` : ''}
                  </td>
                  <td className="p-3 text-sm text-gray-600">{l.car_matricula || '-'}</td>
                  <td className="p-3 text-sm text-gray-600 max-w-xs truncate">{l.summary || '-'}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[l.status] || 'bg-gray-100'}`}>
                      {statusLabels[l.status] || l.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => onDelete(l.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                      Remover
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
