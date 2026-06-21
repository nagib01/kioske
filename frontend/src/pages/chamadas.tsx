import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useMonitorQueue } from '../hooks/useMonitorQueue';
import MesaGrid from '../components/monitor/MesaGrid';
import CurrentCalled from '../components/monitor/CurrentCalled';
import WaitingList from '../components/monitor/WaitingList';

export default function ChamadasPage() {
  const { waitingTickets, currentCalled, calledByTable, servicos, loading, error } = useMonitorQueue();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <Head>
        <title>Senhas Chamadas | Kioske Digital</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* Mobile header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm sm:text-base font-black text-brand uppercase tracking-wider truncate">Kioske Digital</h1>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <h2 className="text-sm font-bold text-gray-800 hidden sm:inline">Senhas Chamadas</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold text-[10px] sm:text-xs tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="hidden sm:inline">LIVE</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto">
        {/* Left / Main content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
          <MesaGrid servicos={servicos} calledByTable={calledByTable} />
          <CurrentCalled currentCalled={currentCalled} />
        </div>

        {/* Right sidebar - waiting list */}
        <WaitingList waitingTickets={waitingTickets} loading={loading} error={error} />
      </main>

      <footer className="bg-white border-t border-gray-200 px-4 py-2 sm:px-6 sm:py-3 flex justify-between items-center text-[10px] sm:text-xs text-gray-400">
        <span>{date}</span>
        <span className="font-bold text-gray-600">{time}</span>
      </footer>
    </div>
  );
}
