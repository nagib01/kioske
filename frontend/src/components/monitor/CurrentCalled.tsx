import type { MonitorTicket } from '../../hooks/useMonitorQueue';

interface CurrentCalledProps {
  currentCalled: MonitorTicket | null;
}

export default function CurrentCalled({ currentCalled }: CurrentCalledProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-md sm:shadow-xl overflow-hidden border border-gray-100 max-w-lg mx-auto">
        <div className="bg-brand text-white text-center py-2 sm:py-3 tracking-wider font-bold text-[10px] sm:text-sm uppercase px-4">
          {currentCalled?.mesa_atendimento ? `MESA ${currentCalled.mesa_atendimento}` : 'AGUARDANDO CHAMADA'}
        </div>
        <div className="p-6 sm:p-10 md:p-14 flex flex-col items-center justify-center">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-none font-black text-brand mb-4 sm:mb-6 tracking-tighter break-all text-center">
            {currentCalled?.token || '---'}
          </h1>
          {currentCalled?.aluno_nome && (
            <div className="bg-green-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-2 sm:gap-3 w-full justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <p className="text-green-800 text-sm sm:text-base font-bold truncate">{currentCalled.aluno_nome}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
