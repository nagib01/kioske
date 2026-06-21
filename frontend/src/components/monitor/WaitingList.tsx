import type { MonitorTicket } from '../../hooks/useMonitorQueue';

const AVG_SERVICE_TIME = parseInt(process.env.NEXT_PUBLIC_AVG_SERVICE_TIME || '12', 10);

interface WaitingListProps {
  waitingTickets: MonitorTicket[];
  loading: boolean;
  error: string | null;
}

export default function WaitingList({ waitingTickets, loading, error }: WaitingListProps) {
  const waitingList = waitingTickets.slice(0, 5);

  return (
    <aside className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 sm:p-5 lg:p-6 flex flex-col max-h-[50vh] lg:max-h-none">
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <h2 className="text-sm sm:text-base font-bold text-gray-800">Próximos na Fila</h2>
        <span className="text-xs text-gray-400 font-medium">{waitingTickets.length} aguardando</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-brand/30 border-t-brand rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-500 text-sm font-medium">{error}</p>
          </div>
        ) : waitingList.length > 0 ? (
          waitingList.map((ticket, idx) => {
            const isUrgent = ticket.prioridade_nivel >= 2;
            const isMedium = ticket.prioridade_nivel === 1;
            const estimatedTime = (idx + 1) * AVG_SERVICE_TIME;

            return (
              <div
                key={ticket.id}
                className={`p-3 sm:p-4 rounded-xl border-l-4 flex justify-between items-center ${
                  isUrgent
                    ? 'bg-red-50 border-red-500'
                    : isMedium
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="min-w-0">
                  <h3 className={`text-base sm:text-lg font-black ${isUrgent ? 'text-red-600' : 'text-brand'}`}>
                    {ticket.token}
                  </h3>
                  <p className={`text-[10px] sm:text-xs ${isUrgent ? 'text-red-500 font-bold' : isMedium ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>
                    {isUrgent ? 'Urgente' : isMedium ? 'Prioritário' : 'Normal'}
                  </p>
                  {ticket.servico?.nome && (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{ticket.servico.nome}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-2">
                  {isUrgent ? (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Próximo</p>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Espera</p>
                      <p className="text-sm sm:text-base font-bold text-gray-800">{estimatedTime} min</p>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 font-medium">Fila vazia</p>
            <p className="text-xs text-gray-400">Nenhum aluno a aguardar</p>
          </div>
        )}
      </div>
    </aside>
  );
}
