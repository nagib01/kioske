import type { Notification } from '../../../hooks/useStudentAccount';

interface ContaNotificacoesTabProps {
  notifications: Notification[];
  naoLidas: number;
  loading: boolean;
  onMarcarLida: (id: string) => void;
  onMarcarTodasLidas: () => void;
}

export default function ContaNotificacoesTab({
  notifications,
  naoLidas,
  loading,
  onMarcarLida,
  onMarcarTodasLidas,
}: ContaNotificacoesTabProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-700">Notificações</h3>
        {naoLidas > 0 && (
          <button onClick={onMarcarTodasLidas} className="text-[10px] text-brand font-medium hover:underline">
            Marcar todas lidas
          </button>
        )}
      </div>
      {loading ? (
        <div className="p-6 text-center text-sm text-gray-500">A carregar...</div>
      ) : notifications.length === 0 ? (
        <div className="p-6 text-center text-gray-400">
          <p className="text-sm">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifications.map((n) => (
            <div key={n.id} className={`p-3 flex items-start gap-2 ${!n.lida ? 'bg-blue-50/50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${n.lida ? 'text-gray-700' : 'text-gray-900 font-bold'}`}>{n.titulo}</p>
                {n.mensagem && <p className="text-[10px] text-gray-500 mt-0.5">{n.mensagem}</p>}
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(n.created_at).toLocaleDateString('pt-PT')} {new Date(n.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.lida && (
                <button onClick={() => onMarcarLida(n.id)} className="text-[10px] text-brand font-medium hover:underline shrink-0 mt-0.5">
                  OK
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
