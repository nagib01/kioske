import { useState } from 'react';
import type { Opcao, Pergunta, PerguntaPayload, Servico } from '../../../hooks/useQuestionarios';

interface PerguntaModalProps {
  editing: Pergunta | null;
  servicos: Servico[];
  onClose: () => void;
  onSave: (editingId: string | null, payload: PerguntaPayload) => Promise<boolean>;
}

export default function PerguntaModal({ editing, servicos, onClose, onSave }: PerguntaModalProps) {
  const editingId = editing?.id ?? null;
  const [texto, setTexto] = useState(editing?.texto ?? '');
  const [servicoId, setServicoId] = useState<string | null>(editing?.servico_id ?? null);
  const [tipo, setTipo] = useState<'single_choice' | 'yes_no'>(editing?.tipo ?? 'single_choice');
  const [obrigatoria, setObrigatoria] = useState(editing?.obrigatoria ?? true);
  const [ordem, setOrdem] = useState(editing?.ordem ?? 0);
  const [ativo, setAtivo] = useState(editing?.ativo ?? true);
  const [opcoes, setOpcoes] = useState<Opcao[]>(editing?.opcoes ?? []);

  const addOpcao = () => {
    setOpcoes([...opcoes, { label: '', value: '', ordem: opcoes.length }]);
  };

  const removeOpcao = (idx: number) => {
    setOpcoes(opcoes.filter((_, i) => i !== idx));
  };

  const updateOpcao = (idx: number, field: keyof Opcao, value: any) => {
    const newOpcoes = [...opcoes];
    newOpcoes[idx] = { ...newOpcoes[idx], [field]: value };
    setOpcoes(newOpcoes);
  };

  const handleSave = async () => {
    const payload: PerguntaPayload = {
      texto,
      servico_id: servicoId || null,
      tipo,
      obrigatoria,
      ordem,
      ativo,
      opcoes: tipo === 'single_choice' ? opcoes : [],
    };
    const ok = await onSave(editingId, payload);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl my-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          {editingId ? 'Editar Pergunta' : 'Nova Pergunta'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto da Pergunta</label>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand outline-none"
              placeholder="Ex: Tem uma atividade agendada?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a Serviço</label>
              <select
                value={servicoId || ''}
                onChange={(e) => setServicoId(e.target.value === '' ? null : e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand outline-none"
              >
                <option value="">Global (Todos os Serviços)</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Resposta</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand outline-none"
              >
                <option value="single_choice">Múltipla Escolha (Opções Dinâmicas)</option>
                <option value="yes_no">Sim / Não</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de Exibição (menor aparece antes)</label>
              <input type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand outline-none" />
            </div>
            <div className="flex items-center gap-2 mt-7">
              <input type="checkbox" id="obrigatoria" checked={obrigatoria} onChange={(e) => setObrigatoria(e.target.checked)} className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand" />
              <label htmlFor="obrigatoria" className="text-sm font-medium text-gray-700">Resposta Obrigatória</label>
            </div>
          </div>

          {editingId && (
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="ativoCheckbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand" />
              <label htmlFor="ativoCheckbox" className="text-sm font-medium text-gray-700">Pergunta Ativa</label>
            </div>
          )}

          {/* Opções Dinâmicas */}
          {tipo === 'single_choice' && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-800">Opções de Resposta</h4>
                <button
                  onClick={addOpcao}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-1 px-3 rounded-lg transition-colors"
                >
                  + Adicionar Opção
                </button>
              </div>

              {opcoes.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhuma opção adicionada. O utilizador não conseguirá responder.</p>
              ) : (
                <div className="space-y-3">
                  {opcoes.map((opcao, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Texto visível (Ex: Mais de 30 min)"
                          value={opcao.label}
                          onChange={(e) => updateOpcao(idx, 'label', e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-brand outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Valor interno (Ex: >30)"
                          value={opcao.value}
                          onChange={(e) => updateOpcao(idx, 'value', e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-brand outline-none"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          placeholder="Ordem"
                          value={opcao.ordem}
                          onChange={(e) => updateOpcao(idx, 'ordem', Number(e.target.value))}
                          className="w-full text-sm border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-brand outline-none"
                        />
                      </div>
                      <button
                        onClick={() => removeOpcao(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remover opção"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
          <button onClick={handleSave} className="px-6 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-bold shadow-sm">Guardar Pergunta</button>
        </div>
      </div>
    </div>
  );
}
