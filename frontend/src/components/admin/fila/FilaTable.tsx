import type { FilaTicket } from '../../../hooks/useFilaLive';

interface FilaTableProps {
  tickets: FilaTicket[];
  actionLoading: string | null;
  onChamar: (ticket: FilaTicket) => void;
  onFinalizar: (ticket: FilaTicket) => void;
  onTransfer: (ticket: FilaTicket) => void;
}

const getTempoEspera = (isoDate: string) => {
  const start = new Date(isoDate).getTime();
  const now = new Date().getTime();
  const diffMins = Math.floor((now - start) / 60000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins === 1) return '1 min';
  if (diffMins > 60) {
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  }
  return `${diffMins} min`;
};

export default function FilaTable({ tickets, actionLoading, onChamar, onFinalizar, onTransfer }: FilaTableProps) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="py-4 px-6 font-bold text-gray-600">Senha</th>
          <th className="py-4 px-6 font-bold text-gray-600">Serviço</th>
          <th className="py-4 px-6 font-bold text-gray-600">Aluno</th>
          <th className="py-4 px-6 font-bold text-gray-600">Prioridade</th>
          <th className="py-4 px-6 font-bold text-gray-600">Estado / Espera</th>
          <th className="py-4 px-6 font-bold text-gray-600 text-right">Ação</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {tickets.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-12 text-center text-gray-500">
              <div className="text-lg font-medium text-gray-500 mb-3">Nenhum ticket em espera</div>
              <p className="font-medium text-lg">A fila está vazia</p>
              <p className="text-sm">Nenhum aluno a aguardar atendimento.</p>
            </td>
          </tr>
        ) : (
          tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className={`transition-colors ${ticket.estado === 'called' ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
            >
              <td className="py-4 px-6">
                <span className="font-black text-xl text-brand">{ticket.senha_gerada}</span>
              </td>
              <td className="py-4 px-6 font-semibold text-gray-700">{ticket.servico_nome}</td>
              <td className="py-4 px-6">
                <div className="font-bold text-gray-800">{ticket.aluno_nome || 'N/A'}</div>
                {ticket.alertas && ticket.alertas.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {ticket.alertas.map((a, i) => (
                      <span key={i} className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider" title={a}>
                        Alerta
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="py-4 px-6">
                {ticket.priority_level > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    Alta (P{ticket.priority_level})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                    Normal
                  </span>
                )}
              </td>
              <td className="py-4 px-6">
                {ticket.estado === 'called' ? (
                  <div className="flex flex-col gap-1">
                    <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full text-center animate-pulse">
                      A SER ATENDIDO
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full text-center">
                      EM ESPERA
                    </span>
                    <span className="text-xs text-gray-500 text-center font-medium">
                      {getTempoEspera(ticket.created_at)}
                    </span>
                  </div>
                )}
              </td>
              <td className="py-4 px-6 text-right">
                {ticket.estado === 'waiting' && (
                  <button
                    onClick={() => onChamar(ticket)}
                    disabled={actionLoading !== null}
                    className={`px-4 py-2 font-bold rounded-lg transition-all ${
                      actionLoading === ticket.id
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {actionLoading === ticket.id ? 'A processar...' : 'Chamar'}
                  </button>
                )}

                {ticket.estado === 'called' && (
                  <>
                    <button
                      onClick={() => onFinalizar(ticket)}
                      disabled={actionLoading !== null}
                      className={`px-3 py-2 font-bold rounded-lg transition-all mr-1 ${
                        actionLoading === ticket.id
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-brand hover:bg-brand-dark text-white shadow-sm hover:shadow-md'
                      }`}
                    >
                      {actionLoading === ticket.id ? '...' : 'Finalizar'}
                    </button>
                    <button
                      onClick={() => onTransfer(ticket)}
                      className="px-3 py-2 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      title="Transferir para outra mesa"
                    >
                      ⇄
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
