import type { MonitorServico, MonitorTicket } from '../../hooks/useMonitorQueue';

const TABLES = (process.env.NEXT_PUBLIC_MONITOR_TABLES || '01,02,03,04').split(',').map((t) => t.trim());

interface MesaGridProps {
  servicos: MonitorServico[];
  calledByTable: Record<string, MonitorTicket>;
}

export default function MesaGrid({ servicos, calledByTable }: MesaGridProps) {
  const visibleMesas =
    servicos.length > 0 ? Array.from(new Set(servicos.flatMap((s) => s.mesas || TABLES))) : TABLES;

  const servicoPorMesa: Record<string, string> = {};
  for (const s of servicos) {
    for (const m of s.mesas || []) {
      servicoPorMesa[m] = s.nome;
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {visibleMesas.map((table) => {
        const ticket = calledByTable[table];
        const servicoNome = servicoPorMesa[table];
        return (
          <div key={table} className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-sm border flex flex-col justify-center items-center min-h-[3.5rem] sm:min-h-[5rem] ${ticket ? 'border-gray-100' : 'border-dashed border-gray-300'}`}>
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">MESA {table}</p>
            {ticket ? (
              <>
                <p className="text-lg sm:text-2xl md:text-3xl font-black text-gray-700">{ticket.token}</p>
                {servicoNome && <p className="text-[8px] sm:text-[10px] text-gray-400 mt-0.5 truncate max-w-full">{servicoNome}</p>}
              </>
            ) : (
              <p className="text-base sm:text-xl font-bold text-gray-300">---</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
