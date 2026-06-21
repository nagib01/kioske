import type { BackofficeTicket } from '../../hooks/useBackofficeQueue';

interface QueueListProps {
  tickets: BackofficeTicket[];
  onTransfer: (ticket: BackofficeTicket) => void;
}

export default function QueueList({ tickets, onTransfer }: QueueListProps) {
  return (
    <div className="lg:col-span-2">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-xl font-bold text-gray-800">Fila de Espera ao Vivo</h3>
        <div className="flex gap-3 text-xs font-bold">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand"></span> Normal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Médio</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600"></span> Urgente</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">A fila está vazia no momento.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tickets.filter((t) => t.estado === 'waiting').map((ticket) => {
              const tempoEspera = Math.floor((new Date().getTime() - new Date(ticket.criado_em).getTime()) / 60000);
              const priorityLevel = ticket.prioridade_nivel || 0;
              const isUrgente = priorityLevel === 2;
              const isMedio = priorityLevel === 1;

              const bgColor = isUrgente ? 'bg-red-100 text-red-600 border border-red-200' : isMedio ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-green-100 text-brand border border-green-200';
              const statusColor = isUrgente ? 'bg-red-600' : isMedio ? 'bg-orange-500' : 'bg-gray-200';
              const statusLabel = isUrgente ? 'Urgente' : isMedio ? 'Médio' : 'Normal';

              return (
                <li key={ticket.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-lg font-black ${bgColor}`}>
                    {ticket.token}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-800">{ticket.aluno_nome}</h4>
                      <span className={`${statusColor} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase`}>{statusLabel}</span>

                      {ticket.alertas && ticket.alertas.length > 0 && (
                        <>
                          {ticket.alertas.includes('urgencia_menos_10min') && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Urgência</span>}
                          {ticket.alertas.includes('hora_marcada') && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">Hora Marcada</span>}
                          {ticket.alertas.includes('documento_faltando') && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded">Documentos</span>}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      {ticket.servico?.nome || 'Atendimento Geral'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isUrgente ? 'text-red-600' : isMedio ? 'text-orange-500' : 'text-gray-800'}`}>{tempoEspera > 0 ? tempoEspera : '< 1'} min</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Espera</p>
                  </div>
                  {(ticket.estado === 'called' || ticket.estado === 'waiting') && (
                    <button
                      onClick={() => onTransfer(ticket)}
                      className="text-blue-600 hover:text-blue-800 px-2 text-sm font-bold"
                      title="Transferir para outra mesa"
                    >
                      ⇄
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
          <a href="/fila" className="text-sm font-bold text-brand hover:underline">Ver Lista Completa</a>
        </div>
      </div>
    </div>
  );
}
