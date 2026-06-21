import { useState } from 'react';
import BackofficeLayout from '../../components/BackofficeLayout';
import DesktopModal from '../../components/DesktopModal';
import { useFilaLive, type FilaTicket } from '../../hooks/useFilaLive';
import FilaMetrics from '../../components/admin/fila/FilaMetrics';
import FilaTable from '../../components/admin/fila/FilaTable';

export default function AdminFilaPage() {
  const {
    tickets,
    stats,
    loading,
    error,
    actionLoading,
    statusFilter,
    setStatusFilter,
    wsConnected,
    fetchFila,
    chamar,
    finalizar,
    transferir,
  } = useFilaLive();

  const [showDeskModal, setShowDeskModal] = useState(false);
  const [pendingTicket, setPendingTicket] = useState<FilaTicket | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [pendingTransferTicket, setPendingTransferTicket] = useState<FilaTicket | null>(null);

  const confirmCall = (mesa: string) => {
    if (!pendingTicket) return;
    const ticket = pendingTicket;
    setShowDeskModal(false);
    setPendingTicket(null);
    chamar(ticket.id, mesa);
  };

  const confirmTransfer = (mesa: string) => {
    if (!pendingTransferTicket) return;
    const ticket = pendingTransferTicket;
    setShowTransferModal(false);
    setPendingTransferTicket(null);
    transferir(ticket.id, mesa);
  };

  const filteredTickets = statusFilter
    ? tickets.filter((t) => t.estado === statusFilter)
    : tickets.filter((t) => t.estado === 'waiting' || t.estado === 'called');

  return (
    <BackofficeLayout activeRoute="/fila" title="Fila em Tempo Real | Kioske Digital">
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800">Fila em Tempo Real</h2>
            <p className="text-gray-500 mt-1">Acompanhe e gira os tickets da escola</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 ${wsConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span> {wsConnected ? 'LIVE' : 'POLLING'}
            </span>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-medium text-gray-600">Filtrar por estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Todos (waiting + called)</option>
            <option value="waiting">Em Espera</option>
            <option value="called">Em Atendimento</option>
            <option value="finished">Finalizados</option>
          </select>
        </div>

        <FilaMetrics stats={stats} />

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Live Queue Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">A carregar fila...</p>
            </div>
          ) : (
            <FilaTable
              tickets={filteredTickets}
              actionLoading={actionLoading}
              onChamar={(ticket) => {
                setPendingTicket(ticket);
                setShowDeskModal(true);
              }}
              onFinalizar={(ticket) => finalizar(ticket.id)}
              onTransfer={(ticket) => {
                setPendingTransferTicket(ticket);
                setShowTransferModal(true);
              }}
            />
          )}
        </div>
        <div className="mt-4 text-center">
          <a href="#" onClick={(e) => { e.preventDefault(); setStatusFilter(''); fetchFila(); }} className="text-sm text-brand hover:underline font-medium">
            Ver Fila Completa (todos os estados) →
          </a>
        </div>
      </div>

      {showDeskModal && pendingTicket && (
        <DesktopModal
          mesaAtendimento={pendingTicket.mesa_atendimento}
          onConfirm={confirmCall}
          onCancel={() => { setShowDeskModal(false); setPendingTicket(null); }}
        />
      )}
      {showTransferModal && pendingTransferTicket && (
        <DesktopModal
          mesaAtendimento={pendingTransferTicket.mesa_atendimento}
          title="Transfer Desk"
          statusText={pendingTransferTicket.senha_gerada}
          onConfirm={confirmTransfer}
          onCancel={() => { setShowTransferModal(false); setPendingTransferTicket(null); }}
        />
      )}
    </BackofficeLayout>
  );
}
