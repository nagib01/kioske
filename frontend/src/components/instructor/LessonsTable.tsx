interface LessonsTableProps {
  lessons: any[];
  loading: boolean;
  onEdit: (lesson: any) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

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

export default function LessonsTable({ lessons, loading, onEdit, onDelete, onUpdateStatus }: LessonsTableProps) {
  return (
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
          ) : lessons.map((l) => (
            <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-3 text-sm text-gray-700">{new Date(l.data).toLocaleDateString('pt-PT')}</td>
              <td className="p-3 text-sm text-gray-600">
                {l.hora_inicio?.substring(0, 5)}{l.hora_fim ? ` - ${l.hora_fim.substring(0, 5)}` : ''}
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
                      <button onClick={() => onUpdateStatus(l.id, 'em_curso')} className="text-yellow-600 hover:text-yellow-800 text-xs font-medium px-1">Iniciar</button>
                      <button onClick={() => onEdit(l)} className="text-brand hover:text-brand-dark text-xs font-medium px-1">Editar</button>
                    </>
                  )}
                  {l.status === 'em_curso' && (
                    <button onClick={() => onUpdateStatus(l.id, 'concluida')} className="text-green-600 hover:text-green-800 text-xs font-medium px-1">Concluir</button>
                  )}
                  {(l.status === 'agendada' || l.status === 'concluida') && (
                    <button onClick={() => onDelete(l.id)} className="text-red-600 hover:text-red-800 text-xs font-medium px-1">Remover</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
