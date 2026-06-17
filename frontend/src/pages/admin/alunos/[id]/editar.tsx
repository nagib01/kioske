import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BackofficeLayout from '../../../../components/BackofficeLayout';
import { useToast } from '../../../../components/Toast';

const CATEGORIAS = ['A', 'B', 'C', 'D', 'BE', 'CE', 'DE'];
const ESTADOS_FORMACAO = [
  { value: 'inscrito', label: 'Inscrito' },
  { value: 'em_formacao', label: 'Em Formação' },
  { value: 'teorico_concluido', label: 'Teórico Concluído' },
  { value: 'pratico_concluido', label: 'Prático Concluído' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'suspenso', label: 'Suspenso' },
];

export default function EditarAlunoPage() {
  const { addToast } = useToast();
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    numero_estudante: '',
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    data_nascimento: '',
    documento_identificacao: '',
    categoria: 'B',
    estado_formacao: 'inscrito',
    data_matricula: '',
    observacoes: '',
    ativo: true,
  });

  const getHeaders = () => {
    const token = localStorage.getItem('backoffice_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Aluno não encontrado');
        const data = await res.json();
        setForm({
          numero_estudante: data.numero_estudante || '',
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          endereco: data.endereco || '',
          data_nascimento: data.data_nascimento ? data.data_nascimento.split('T')[0] : '',
          documento_identificacao: data.documento_identificacao || '',
          categoria: data.categoria || 'B',
          estado_formacao: data.estado_formacao || 'inscrito',
          data_matricula: data.data_matricula ? data.data_matricula.split('T')[0] : '',
          observacoes: data.observacoes || '',
          ativo: data.ativo !== false,
        });
      } catch (err: any) {
        addToast(err.message, 'error');
        router.push('/admin/alunos');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setForm({ ...form, [target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero_estudante || !form.nome || !form.categoria) {
      addToast('Preencha os campos obrigatórios', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao atualizar aluno');
      }
      router.push(`/admin/alunos/${id}`);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BackofficeLayout activeRoute="/admin/alunos" title="Editar Aluno | Kioske Digital">
        <div className="p-8 text-center text-gray-500">Carregando...</div>
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout activeRoute="/admin/alunos" title="Editar Aluno | Kioske Digital">
      <div className="p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Editar Aluno</h2>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nº de Estudante *</label>
              <input type="text" name="numero_estudante" value={form.numero_estudante} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome *</label>
              <input type="text" name="nome" value={form.nome} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Telefone</label>
              <input type="text" name="telefone" value={form.telefone} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Data de Nascimento</label>
              <input type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Documento de Identificação</label>
              <input type="text" name="documento_identificacao" value={form.documento_identificacao} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Categoria *</label>
              <select name="categoria" value={form.categoria} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50">
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Estado de Formação</label>
              <select name="estado_formacao" value={form.estado_formacao} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50">
                {ESTADOS_FORMACAO.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Data de Matrícula</label>
              <input type="date" name="data_matricula" value={form.data_matricula} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50" />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="ativo" checked={form.ativo} onChange={handleChange}
                  className="w-5 h-5 text-[#047857] border-gray-300 rounded focus:ring-[#047857]" />
                <span className="text-sm font-bold text-gray-700">Aluno Ativo</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Endereço</label>
            <input type="text" name="endereco" value={form.endereco} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={3}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50" />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <button type="submit" disabled={saving}
              className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'A Salvar...' : 'Guardar Alterações'}
            </button>
            <button type="button" onClick={() => router.push(`/admin/alunos/${id}`)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-8 rounded-lg transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}
