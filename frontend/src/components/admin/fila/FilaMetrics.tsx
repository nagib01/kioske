import type { FilaStats } from '../../../hooks/useFilaLive';

interface FilaMetricsProps {
  stats: FilaStats;
}

export default function FilaMetrics({ stats }: FilaMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-2xl">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Atendidos Hoje</p>
          <h3 className="text-3xl font-black text-gray-800">{stats.atendidosHoje}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 text-2xl">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tempo Médio de Espera</p>
          <h3 className="text-3xl font-black text-gray-800">{stats.tempoMedioEspera} <span className="text-lg font-bold text-gray-400">min</span></h3>
        </div>
      </div>
    </div>
  );
}
