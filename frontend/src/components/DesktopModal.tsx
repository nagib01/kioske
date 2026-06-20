import { useState } from 'react';

interface DesktopModalProps {
  mesaAtendimento?: string;
  onConfirm: (mesa: string) => void;
  onCancel: () => void;
  title?: string;
  statusText?: string;
}

export default function DesktopModal({ mesaAtendimento, onConfirm, onCancel, title = 'Service Desk', statusText = 'waiting + called' }: DesktopModalProps) {
  const [mesa, setMesa] = useState(mesaAtendimento || '01');

  const increment = () => setMesa(v => String(Number(v) + 1).padStart(2, '0'));
  const decrement = () => setMesa(v => String(Math.max(1, Number(v) - 1)).padStart(2, '0'));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 sm:p-8 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
          <div className="flex items-center justify-center gap-3 my-4">
            <button onClick={decrement} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-xl font-bold flex items-center justify-center transition-colors">−</button>
            <input
              type="text"
              value={mesa}
              onChange={e => setMesa(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className="w-24 text-center text-5xl sm:text-6xl font-black text-[#047857] bg-transparent border-none outline-none focus:ring-0 p-0"
            />
            <button onClick={increment} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-xl font-bold flex items-center justify-center transition-colors">+</button>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-6">{statusText}</p>
          <div className="flex gap-3">
            <button
              onClick={() => onConfirm(mesa)}
              className="flex-1 bg-[#047857] hover:bg-[#065f46] text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
            >
              OK
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}