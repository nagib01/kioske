import type { Aula } from '../../../hooks/useStudentAccount';

interface ContaAulasTabProps {
  aulas: Aula[];
  loading: boolean;
}

export default function ContaAulasTab({ aulas, loading }: ContaAulasTabProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-3 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-700">Registo de Aulas</h3>
      </div>
      {loading ? (
        <div className="p-6 text-center text-sm text-gray-500">A carregar...</div>
      ) : aulas.length === 0 ? (
        <div className="p-6 text-center text-gray-400">
          <p className="text-sm">Nenhuma aula registada</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {aulas.map((a) => {
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
              <div key={a.id} className="p-3">
                <div className="flex items-start gap-2 mb-1">
                  <span className={`text-xs font-bold shrink-0 ${a.tipo === 'pratica' ? 'text-blue-600' : 'text-purple-600'}`}>
                    {a.tipo === 'pratica' ? 'Prática' : 'Teórica'}
                  </span>
                  <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[a.status] || 'bg-gray-100'}`}>
                    {statusLabels[a.status] || a.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>{new Date(a.data).toLocaleDateString('pt-PT')} {a.hora_inicio?.substring(0, 5) || ''}{a.hora_fim ? ` - ${a.hora_fim.substring(0, 5)}` : ''}</p>
                  <p>{a.instructor_nome && `Instrutor: ${a.instructor_nome}`}{a.car_matricula && ` · ${a.car_matricula}`}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
