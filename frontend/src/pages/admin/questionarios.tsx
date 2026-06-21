import { useEffect, useState } from 'react';
import BackofficeLayout from '../../components/BackofficeLayout';
import { useToast } from '../../components/Toast';
import { backofficeHeaders } from '../../lib/auth';

interface Opcao {
  id?: string;
  label: string;
  value: string;
  ordem: number;
  ativo?: boolean;
}

interface Pergunta {
  id: string;
  servico_id: string | null;
  texto: string;
  tipo: 'single_choice' | 'yes_no';
  obrigatoria: boolean;
  ordem: number;
  ativo: boolean;
  opcoes: Opcao[];
}

interface Servico {
  id: string;
  nome: string;
}

export default function AdminQuestionariosPage() {
  const { addToast } = useToast();
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [texto, setTexto] = useState('');
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [tipo, setTipo] = useState<'single_choice' | 'yes_no'>('single_choice');
  const [obrigatoria, setObrigatoria] = useState(true);
  const [ordem, setOrdem] = useState(0);
  const [ativo, setAtivo] = useState(true);
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);

  useEffect(() => {
    fetchDados();
  }, []);

  const getHeaders = () => backofficeHeaders({ escola: true });

  const fetchDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resPerguntas, resServicos] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/perguntas-triagem`, { headers: getHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/servicos`, { headers: getHeaders() })
      ]);

      if (!resPerguntas.ok) throw new Error('Falha ao carregar perguntas');
      if (!resServicos.ok) throw new Error('Falha ao carregar serviços');

      const dataPerguntas = await resPerguntas.json();
      const dataServicos = await resServicos.json();

      setPerguntas(dataPerguntas.perguntas || []);
      setServicos(dataServicos.servicos || []);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setTexto('');
    setServicoId(null);
    setTipo('single_choice');
    setObrigatoria(true);
    setOrdem(0);
    setAtivo(true);
    setOpcoes([]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Pergunta) => {
    setEditingId(p.id);
    setTexto(p.texto);
    setServicoId(p.servico_id);
    setTipo(p.tipo);
    setObrigatoria(p.obrigatoria);
    setOrdem(p.ordem);
    setAtivo(p.ativo);
    setOpcoes(p.opcoes || []);
    setIsModalOpen(true);
  };

  const savePergunta = async () => {
    setError(null);
    try {
      const payload = {
        texto,
        servico_id: servicoId || null,
        tipo,
        obrigatoria,
        ordem,
        ativo,
        opcoes: tipo === 'single_choice' ? opcoes : []
      };

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/perguntas-triagem/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/perguntas-triagem`;

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Falha ao salvar pergunta');

      setIsModalOpen(false);
      await fetchDados();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const deletePergunta = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja desativar esta pergunta?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/perguntas-triagem/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Falha ao desativar pergunta');
      await fetchDados();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

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

  const getServicoNome = (id: string | null) => {
    if (!id) return 'Global (Todos)';
    const servico = servicos.find(s => s.id === id);
    return servico ? servico.nome : 'Desconhecido';
  };

  return (
    <BackofficeLayout activeRoute="/questionarios" title="Administração - Triagem | Kioske Digital">
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800">Gerir Questionários</h2>
          <button
            onClick={openNewModal}
            className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            + Nova Pergunta
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">A carregar perguntas...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 font-bold text-gray-600">Pergunta</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Serviço</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Tipo</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Obrigatória</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Estado</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {perguntas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Nenhuma pergunta encontrada.
                    </td>
                  </tr>
                ) : (
                  perguntas.map((pergunta) => (
                    <tr key={pergunta.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-800 max-w-xs truncate">{pergunta.texto}</td>
                      <td className="py-4 px-6 text-gray-600">
                        {pergunta.servico_id ? (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                            {getServicoNome(pergunta.servico_id)}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-semibold">
                            Global
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {pergunta.tipo === 'yes_no' ? 'Sim/Não' : 'Múltipla Escolha'}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {pergunta.obrigatoria ? 'Sim' : 'Não'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${pergunta.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {pergunta.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button onClick={() => openEditModal(pergunta)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                        <button onClick={() => deletePergunta(pergunta.id)} className="text-red-600 hover:text-red-800 font-medium">Desativar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
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
                  onChange={e => setTexto(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand outline-none" 
                  placeholder="Ex: Tem uma atividade agendada?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a Serviço</label>
                  <select 
                    value={servicoId || ''} 
                    onChange={e => setServicoId(e.target.value === '' ? null : e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value="">Global (Todos os Serviços)</option>
                    {servicos.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Resposta</label>
                  <select 
                    value={tipo} 
                    onChange={e => setTipo(e.target.value as any)}
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
                  <input type="number" value={ordem} onChange={e => setOrdem(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand outline-none" />
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input type="checkbox" id="obrigatoria" checked={obrigatoria} onChange={e => setObrigatoria(e.target.checked)} className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand" />
                  <label htmlFor="obrigatoria" className="text-sm font-medium text-gray-700">Resposta Obrigatória</label>
                </div>
              </div>

              {editingId && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="ativoCheckbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand" />
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
                              onChange={e => updateOpcao(idx, 'label', e.target.value)}
                              className="w-full text-sm border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-brand outline-none"
                            />
                          </div>
                          <div className="flex-1">
                            <input 
                              type="text" 
                              placeholder="Valor interno (Ex: >30)"
                              value={opcao.value}
                              onChange={e => updateOpcao(idx, 'value', e.target.value)}
                              className="w-full text-sm border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-brand outline-none"
                            />
                          </div>
                          <div className="w-20">
                            <input 
                              type="number" 
                              placeholder="Ordem"
                              value={opcao.ordem}
                              onChange={e => updateOpcao(idx, 'ordem', Number(e.target.value))}
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
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
              <button onClick={savePergunta} className="px-6 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-bold shadow-sm">Guardar Pergunta</button>
            </div>
          </div>
        </div>
      )}
    </BackofficeLayout>
  );
}
