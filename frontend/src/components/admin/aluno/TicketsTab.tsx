import { useState } from 'react';

interface TicketsTabProps {
  tickets: any[];
  onAssociate: (ticketId: string) => Promise<boolean>;
}

export default function TicketsTab({ tickets, onAssociate }: TicketsTabProps) {
  const [associateTicketId, setAssociateTicketId] = useState('');

  const handleAssociate = async () => {
    const ok = await onAssociate(associateTicketId);
    if (ok) setAssociateTicketId('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Associate ticket */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <input type="text" placeholder="ID do ticket para associar..." value={associateTicketId}
          onChange={(e) => setAssociateTicketId(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
        <button onClick={handleAssociate}
          className="bg-brand hover:bg-brand-dark text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors">
          Associar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-xs font-bold text-gray-600">Senha</th>
              <th className="text-left p-3 text-xs font-bold text-gray-600">Serviço</th>
              <th className="text-left p-3 text-xs font-bold text-gray-600">Estado</th>
              <th className="text-left p-3 text-xs font-bold text-gray-600">Mesa</th>
              <th className="text-left p-3 text-xs font-bold text-gray-600">Data</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500 text-sm">Nenhum ticket associado</td></tr>
            ) : tickets.map((t: any) => (
              <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 text-sm font-mono font-bold text-gray-700">{t.codigo_senha}</td>
                <td className="p-3 text-sm text-gray-600">{t.servico_nome}</td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                    t.status === 'finished' ? 'bg-green-100 text-green-800' :
                    t.status === 'called' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {t.status === 'finished' ? 'Concluído' : t.status === 'called' ? 'Em Atendimento' : 'Em Espera'}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-600">{t.mesa_atendimento || '-'}</td>
                <td className="p-3 text-sm text-gray-500">{new Date(t.created_at).toLocaleDateString('pt-PT')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
