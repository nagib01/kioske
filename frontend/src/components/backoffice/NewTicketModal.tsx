import type { ServicoOption } from '../../hooks/useBackofficeQueue';

interface NewTicketModalProps {
  open: boolean;
  servicos: ServicoOption[];
  servico: string;
  onServicoChange: (value: string) => void;
  nome: string;
  onNomeChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function NewTicketModal({
  open,
  servicos,
  servico,
  onServicoChange,
  nome,
  onNomeChange,
  onCancel,
  onConfirm,
}: NewTicketModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Nova Senha Manual</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
            <select
              value={servico}
              onChange={(e) => onServicoChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Selecione...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Aluno (opcional)</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => onNomeChange(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
          <button onClick={onConfirm} className="px-6 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-bold">Criar Senha</button>
        </div>
      </div>
    </div>
  );
}
