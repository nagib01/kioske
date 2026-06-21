import type { AlunosDashboardData } from '../../../hooks/useAlunosList';

interface AlunosDashboardProps {
  dashboard: AlunosDashboardData;
}

export default function AlunosDashboard({ dashboard }: AlunosDashboardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <p className="text-sm text-gray-500 font-medium">Total Alunos</p>
        <p className="text-3xl font-bold text-brand mt-1">{dashboard.total}</p>
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
  );
}
