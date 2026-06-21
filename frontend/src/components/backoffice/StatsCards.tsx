interface StatsCardsProps {
  pessoasAguardando: number;
  tempoMedioEspera: number;
  atendidosHoje: number;
  prioritarios: number;
  loading: boolean;
  onChamarProximo: () => void;
}

export default function StatsCards({
  pessoasAguardando,
  tempoMedioEspera,
  atendidosHoje,
  prioritarios,
  loading,
  onChamarProximo,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="md:col-span-2 bg-brand text-white rounded-2xl p-6 shadow-lg flex justify-between items-center relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-10">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>
        <div className="relative z-10">
          <p className="text-green-100 text-sm font-bold tracking-wider mb-1">STATUS ATUAL DA FILA</p>
          <h3 className="text-4xl font-black mb-2">{pessoasAguardando} Pessoas<br/>Aguardando</h3>
          <p className="text-green-100 text-sm">Tempo médio de espera: {tempoMedioEspera} minutos</p>
        </div>
        <div className="relative z-10">
          <button onClick={onChamarProximo} disabled={loading} className="bg-white text-brand hover:bg-green-50 font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {loading ? 'A chamar...' : 'Chamar Próximo'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col justify-between">
        <div className="text-gray-400 mb-2">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <h4 className="text-3xl font-black text-gray-800">{atendidosHoje}</h4>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Atendidos Hoje</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col justify-between">
        <div className="text-red-400 mb-2">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <h4 className="text-3xl font-black text-gray-800">{prioritarios < 10 ? `0${prioritarios}` : prioritarios}</h4>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Prioritários</p>
        </div>
      </div>
    </div>
  );
}
