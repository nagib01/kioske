import type { TicketData } from '../../hooks/useKioskTriage';

interface TicketCardProps {
  ticketData: TicketData;
  isConnected: boolean;
  onReimprimir: () => void;
  onCancelar: () => void;
}

export default function TicketCard({ ticketData, isConnected, onReimprimir, onCancelar }: TicketCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm mx-auto overflow-hidden border border-gray-100">
      <div className={`py-2 px-4 flex justify-between items-center text-white text-xs font-bold tracking-wider ${ticketData.estado === 'called' ? 'bg-red-600' : 'bg-brand'}`}>
        <span>ESTADO: {ticketData.estado === 'called' ? 'CHAMADA' : 'EM ESPERA'}</span>
        <span className="flex items-center gap-1.5">
          {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
          LIVE
        </span>
      </div>

      <div className="p-5 flex flex-col items-center">
        <div className="w-full border-2 border-dashed border-green-200 rounded-xl p-5 mb-5 text-center bg-green-50/30">
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest block mb-1">Senha Atual</span>
          <span className={`text-4xl font-black ${ticketData.estado === 'called' ? 'text-red-600' : 'text-brand'}`}>
            {ticketData.token || ticketData.codigo_senha}
          </span>
        </div>

        <div className="flex gap-3 w-full mb-5">
          <div className="flex-1 bg-blue-50/50 p-3 rounded-xl text-center border border-blue-100">
            <span className="text-[10px] text-gray-500 font-bold mb-0.5 block">SUA VEZ EM:</span>
            <span className="text-xl font-bold text-gray-800">{ticketData.tempo_estimado_min} min</span>
          </div>
          <div className="flex-1 bg-blue-50/50 p-3 rounded-xl text-center border border-blue-100">
            <span className="text-[10px] text-gray-500 font-bold mb-0.5 block">PESSOAS A FRENTE:</span>
            <span className="text-xl font-bold text-gray-800">{ticketData.posicao_fila}</span>
          </div>
        </div>

        {ticketData.alertas && ticketData.alertas.length > 0 && (
          <div className="w-full bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-start gap-2 mb-4">
            <span className="text-orange-500 font-bold shrink-0">!</span>
            <div>
              <p className="font-bold text-orange-800 text-xs mb-0.5">Alertas:</p>
              {ticketData.alertas.map((alerta, i) => (
                <p key={i} className="text-orange-700 text-xs">
                  {alerta === 'urgencia_menos_10min' && 'Tem atividade em menos de 10 minutos'}
                  {alerta === 'hora_marcada' && 'Tem hora marcada para esta atividade'}
                </p>
              ))}
            </div>
          </div>
        )}

        {ticketData.qrCode && (
          <div className="w-full mb-4 flex flex-col items-center">
            <h4 className="font-bold text-gray-800 text-xs mb-2">Acompanhe no Telemóvel</h4>
            <img src={ticketData.qrCode} alt="QR Code da senha" className="w-32 h-32" />
            <p className="text-[10px] text-gray-500 mt-1 text-center">
              Aponte a câmara para o QR Code
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-3 flex gap-3 border-t border-gray-100">
        <button
          onClick={onReimprimir}
          className="flex-1 py-3 font-bold text-brand hover:bg-green-50 rounded-lg text-sm transition-colors"
        >
          Reimprimir
        </button>
        <button onClick={onCancelar} className="flex-1 py-3 font-bold text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}
