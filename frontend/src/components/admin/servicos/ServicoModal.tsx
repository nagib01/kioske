import { useState } from 'react';
import type { Servico, ServicoPayload } from '../../../hooks/useServicos';

interface ServicoModalProps {
  editing: Servico | null;
  onClose: () => void;
  onSave: (editingId: string | null, payload: ServicoPayload) => Promise<boolean>;
}

const ALL_TABLES = process.env.NEXT_PUBLIC_AVAILABLE_TABLES
  ? process.env.NEXT_PUBLIC_AVAILABLE_TABLES.split(',').map((t) => t.trim())
  : ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

export default function ServicoModal({ editing, onClose, onSave }: ServicoModalProps) {
  const editingId = editing?.id ?? null;
  const [nome, setNome] = useState(editing?.nome ?? '');
  const [codigoPrefixo, setCodigoPrefixo] = useState(editing?.codigo_prefixo ?? 'A');
  const [tempoMedio, setTempoMedio] = useState(editing?.tempo_medio_atendimento ?? 10);
  const [prioridadeBase, setPrioridadeBase] = useState(editing?.prioridade_base ?? 0);
  const [mesaPadrao, setMesaPadrao] = useState(editing?.mesa_padrao || '01');
  const [mesas, setMesas] = useState<string[]>(
    editing?.mesas && editing.mesas.length > 0 ? editing.mesas : ['01', '02', '03', '04'],
  );
  const [ativo, setAtivo] = useState(editing?.ativo ?? true);

  const toggleMesa = (mesa: string) => {
    setMesas((prev) => (prev.includes(mesa) ? prev.filter((m) => m !== mesa) : [...prev, mesa].sort()));
  };

  const handleSave = async () => {
    const payload: ServicoPayload = {
      nome,
      codigo_prefixo: codigoPrefixo,
      tempo_medio_atendimento: tempoMedio,
      prioridade_base: prioridadeBase,
      mesa_padrao: mesaPadrao,
      mesas,
      ativo,
    };
    const ok = await onSave(editingId, payload);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          {editingId ? 'Editar Serviço' : 'Novo Serviço'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prefixo Senha (ex: A)</label>
              <input type="text" value={codigoPrefixo} onChange={(e) => setCodigoPrefixo(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" maxLength={5} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Médio (min)</label>
              <input type="number" value={tempoMedio} onChange={(e) => setTempoMedio(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade Base (0 = Normal)</label>
            <input type="number" value={prioridadeBase} onChange={(e) => setPrioridadeBase(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mesa Padrão (chamada)</label>
            <select value={mesaPadrao} onChange={(e) => setMesaPadrao(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2">
              {mesas.map((m) => <option key={m} value={m}>Mesa {m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mesas deste serviço (máx 4)</label>
            <div className="grid grid-cols-4 gap-2">
              {ALL_TABLES.map((mesa) => {
                const selected = mesas.includes(mesa);
                const atLimit = !selected && mesas.length >= 4;
                return (
                  <button
                    key={mesa}
                    type="button"
                    disabled={atLimit}
                    onClick={() => toggleMesa(mesa)}
                    className={`py-2 px-1 rounded-lg text-sm font-bold border-2 transition-all ${
                      selected
                        ? 'bg-brand text-white border-brand'
                        : atLimit
                        ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-brand hover:text-brand'
                    }`}
                  >
                    M{mesa}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Selecione até 4 mesas. Usadas no ecrã de TV (monitor).</p>
          </div>

          {editingId && (
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="ativoCheckbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="w-4 h-4 text-green-600 rounded border-gray-300" />
              <label htmlFor="ativoCheckbox" className="text-sm font-medium text-gray-700">Serviço Ativo</label>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-bold">Salvar</button>
        </div>
      </div>
    </div>
  );
}
