import { useEffect, useState } from 'react';
import BackofficeLayout from '../../components/BackofficeLayout';
import { useToast } from '../../components/Toast';

interface Servico {
  id: string;
  nome: string;
  tempo_medio_atendimento: number;
  codigo_prefixo: string;
  prioridade_base: number;
  ativo: boolean;
  mesa_padrao: string;
  mesas?: string[];
}

export default function AdminServicosPage() {
  const { addToast } = useToast();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [codigoPrefixo, setCodigoPrefixo] = useState('A');
  const [tempoMedio, setTempoMedio] = useState(10);
  const [prioridadeBase, setPrioridadeBase] = useState(0);
  const [mesaPadrao, setMesaPadrao] = useState('01');
  const [mesas, setMesas] = useState<string[]>(['01', '02', '03', '04']);
  const [ativo, setAtivo] = useState(true);

  const ALL_TABLES = process.env.NEXT_PUBLIC_AVAILABLE_TABLES
    ? process.env.NEXT_PUBLIC_AVAILABLE_TABLES.split(',').map(t => t.trim())
    : ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  const toggleMesa = (mesa: string) => {
    setMesas(prev =>
      prev.includes(mesa) ? prev.filter(m => m !== mesa) : [...prev, mesa].sort()
    );
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('backoffice_token');
    const escolaId = localStorage.getItem('backoffice_escola');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (escolaId) headers['x-escola-id'] = escolaId;
    return headers;
  };

  const fetchServicos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/servicos`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Falha ao carregar serviços');
      const data = await res.json();
      setServicos(data.servicos || []);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setNome('');
    setCodigoPrefixo('A');
    setTempoMedio(10);
    setPrioridadeBase(0);
    setMesaPadrao('01');
    setMesas(['01', '02', '03', '04']);
    setAtivo(true);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Servico) => {
    setEditingId(s.id);
    setNome(s.nome);
    setCodigoPrefixo(s.codigo_prefixo);
    setTempoMedio(s.tempo_medio_atendimento);
    setPrioridadeBase(s.prioridade_base);
    setMesaPadrao(s.mesa_padrao || '01');
    setMesas(s.mesas && s.mesas.length > 0 ? s.mesas : ['01', '02', '03', '04']);
    setAtivo(s.ativo);
    setIsModalOpen(true);
  };

  const saveServico = async () => {
    setError(null);
    try {
      const payload = {
        nome,
        codigo_prefixo: codigoPrefixo,
        tempo_medio_atendimento: tempoMedio,
        prioridade_base: prioridadeBase,
        mesa_padrao: mesaPadrao,
        mesas,
        ativo
      };

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/servicos/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/servicos`;

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Erro ${res.status}: Falha ao salvar serviço`);
      }
      
      setIsModalOpen(false);
      await fetchServicos();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const deleteServico = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja desativar este serviço?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/servicos/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Falha ao desativar serviço');
      await fetchServicos();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  return (
    <BackofficeLayout activeRoute="/admin/servicos" title="Administração - Serviços | Kioske Digital">
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800">Gerir Serviços</h2>
          <button
            onClick={openNewModal}
            className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            + Novo Serviço
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">A carregar serviços...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 font-bold text-gray-600">Nome do Serviço</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Prefixo</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Tempo Médio (min)</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Mesas</th>
                  <th className="py-4 px-6 font-bold text-gray-600">Estado</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {servicos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Nenhum serviço encontrado.
                    </td>
                  </tr>
                ) : (
                  servicos.map((servico) => (
                    <tr key={servico.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-800">{servico.nome}</td>
                      <td className="py-4 px-6 text-gray-600">{servico.codigo_prefixo}</td>
                      <td className="py-4 px-6 text-gray-600">{servico.tempo_medio_atendimento}</td>
                      <td className="py-4 px-6 text-gray-600">
                        {servico.mesas && servico.mesas.length > 0
                          ? servico.mesas.map(m => `M${m}`).join(', ')
                          : servico.mesa_padrao || '01'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${servico.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {servico.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button onClick={() => openEditModal(servico)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                        <button onClick={() => deleteServico(servico.id)} className="text-red-600 hover:text-red-800 font-medium">Desativar</button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editingId ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefixo Senha (ex: A)</label>
                  <input type="text" value={codigoPrefixo} onChange={e => setCodigoPrefixo(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" maxLength={5} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Médio (min)</label>
                  <input type="number" value={tempoMedio} onChange={e => setTempoMedio(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade Base (0 = Normal)</label>
                <input type="number" value={prioridadeBase} onChange={e => setPrioridadeBase(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesa Padrão (chamada)</label>
                <select value={mesaPadrao} onChange={e => setMesaPadrao(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2">
                  {mesas.map(m => <option key={m} value={m}>Mesa {m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesas deste serviço (máx 4)</label>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_TABLES.map(mesa => {
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
                            ? 'bg-[#047857] text-white border-[#047857]'
                            : atLimit
                            ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-[#047857] hover:text-[#047857]'
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
                  <input type="checkbox" id="ativoCheckbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="w-4 h-4 text-green-600 rounded border-gray-300" />
                  <label htmlFor="ativoCheckbox" className="text-sm font-medium text-gray-700">Serviço Ativo</label>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
              <button onClick={saveServico} className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-lg font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </BackofficeLayout>
  );
}
