import { useState, useEffect } from 'react';
import InstructorLayout from '../../components/InstructorLayout';
import { apiUrl as api } from '../../lib/api';
import Link from 'next/link';

type DashboardData = {
  aulas_hoje: number;
  horas_hoje: string;
  aulas_em_curso: number;
  contagem_status: Record<string, number>;
  proximas_aulas: any[];
};

export default function InstructorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('backoffice_token');
    fetch(api('/api/instructor/dashboard'), {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : null).then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <InstructorLayout>
      <div className="p-8 flex items-center justify-center min-h-[60vh] text-gray-500">A carregar...</div>
    </InstructorLayout>
  );

  return (
    <InstructorLayout title="Dashboard | Instrutor">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard do Instrutor</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">Aulas Hoje</p>
            <p className="text-3xl font-bold text-brand">{data?.aulas_hoje ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">Horas Hoje</p>
            <p className="text-3xl font-bold text-blue-600">{data?.horas_hoje ?? '0.0'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">Em Curso</p>
            <p className="text-3xl font-bold text-yellow-600">{data?.aulas_em_curso ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Aulas</p>
            <p className="text-3xl font-bold text-purple-600">
              {Object.values(data?.contagem_status ?? {}).reduce((a: number, b: number) => a + b, 0)}
            </p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="font-bold text-gray-700 mb-3">Aulas por Estado</h3>
          <div className="flex gap-4">
            {Object.entries(data?.contagem_status ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm font-bold text-gray-700">{status}:</span>
                <span className="text-lg font-bold text-brand">{count}</span>
              </div>
            ))}
            {(!data?.contagem_status || Object.keys(data.contagem_status).length === 0) && (
              <span className="text-sm text-gray-500">Nenhuma aula registada</span>
            )}
          </div>
        </div>

        {/* Next Lessons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700">Próximas Aulas</h3>
            <Link href="/instrutor/aulas" className="text-brand text-sm font-medium hover:underline">
              Ver Todas
            </Link>
          </div>
          {data?.proximas_aulas && data.proximas_aulas.length > 0 ? (
            <div className="space-y-3">
              {data.proximas_aulas.map((aula: any) => (
                <div key={aula.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="font-bold text-gray-800">{aula.student_nome}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(aula.data).toLocaleDateString('pt-PT')} | {aula.hora_inicio?.substring(0,5)} - {aula.hora_fim?.substring(0,5)}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${aula.tipo === 'pratica' ? 'text-blue-600' : 'text-purple-600'}`}>
                    {aula.tipo === 'pratica' ? 'Prática' : 'Teórica'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma aula futura agendada</p>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}
