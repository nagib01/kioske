import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BackofficeLayout from '../../../components/BackofficeLayout';
import { useToast } from '../../../components/Toast';

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

export default function NovoAlunoPage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    numero_estudante: '',
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    endereco: '',
    data_nascimento: '',
    documento_identificacao: '',
    categoria: 'B',
    estado_formacao: 'inscrito',
    data_matricula: new Date().toISOString().split('T')[0],
    observacoes: '',
  });

  const getHeaders = () => {
    const token = localStorage.getItem('backoffice_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero_estudante || !form.nome || !form.categoria) {
      addToast('Preencha os campos obrigatórios', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao criar aluno');
      }
      router.push('/alunos');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BackofficeLayout activeRoute="/alunos" title="Novo Aluno | Kioske Digital">
      <div className="p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Novo Aluno</h2>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Senha (para login do aluno)</label>
                <input type="password" name="senha" value={form.senha} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047857]/50" placeholder="Deixe vazio para não definir senha" />
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
              {saving ? 'A Salvar...' : 'Salvar Aluno'}
            </button>
            <button type="button" onClick={() => router.push('/alunos')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-8 rounded-lg transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}
