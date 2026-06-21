interface PerfilTabProps {
  student: any;
}

export default function PerfilTab({ student }: PerfilTabProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-700 mb-4">Resumo do Aluno</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{student.total_tickets || 0}</p>
          <p className="text-sm text-gray-600">Total Senhas</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{student.tickets_concluidos || 0}</p>
          <p className="text-sm text-gray-600">Senhas Concluídas</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{student.aulas_realizadas || 0}</p>
          <p className="text-sm text-gray-600">Aulas Realizadas</p>
        </div>
      </div>
    </div>
  );
}
