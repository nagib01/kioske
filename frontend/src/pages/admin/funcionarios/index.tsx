import { useState, useEffect } from 'react';
import BackofficeLayout from '../../../components/BackofficeLayout';
import { useToast } from '../../../components/Toast';
import { apiUrl as api } from '../../../lib/api';

type Employee = {
  id: string;
  nome: string;
  email?: string;
  role: string;
  telefone?: string;
  ativo: boolean;
  created_at: string;
};

type EmployeeForm = {
  nome: string;
  email: string;
  senha: string;
  role: string;
  telefone: string;
};

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  recepcionista: 'Rececionista',
  instructor: 'Instrutor',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  recepcionista: 'bg-blue-100 text-blue-800',
  instructor: 'bg-green-100 text-green-800',
};

const emptyForm: EmployeeForm = { nome: '', email: '', senha: '', role: 'instructor', telefone: '' };

export default function AdminFuncionarios() {
  const { addToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const token = typeof window !== 'undefined' ? localStorage.getItem('backoffice_token') : null;

  const fetchEmployees = async () => {
    const t = token || localStorage.getItem('backoffice_token');
    const res = await fetch(api('/admin/users'), {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.ok) setEmployees(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (u: Employee) => {
    setForm({ nome: u.nome, email: u.email || '', senha: '', role: u.role, telefone: u.telefone || '' });
    setEditingId(u.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    const t = token || localStorage.getItem('backoffice_token');
    const base = api('/admin/users');
    const url = editingId ? `${base}/${editingId}` : base;
    const method = editingId ? 'PUT' : 'POST';

    const body: any = { nome: form.nome, email: form.email, role: form.role, telefone: form.telefone };
    if (form.senha) body.senha = form.senha;

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowModal(false);
      fetchEmployees();
    } else {
      const err = await res.json();
      addToast(err.error || 'Erro ao salvar', 'error');
    }
  };

  const handleToggleActive = async (u: Employee) => {
    const t = token || localStorage.getItem('backoffice_token');
    const res = await fetch(api(`/admin/users/${u.id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.ok) fetchEmployees();
  };

  return (
    <BackofficeLayout activeRoute="/funcionarios" title="Funcionários | Backoffice">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Funcionários</h1>
          <button onClick={openCreate} className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
            + Novo Funcionário
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-3 text-xs font-bold text-gray-600">Nome</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Email</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Telefone</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Função</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Estado</th>
                <th className="text-right p-3 text-xs font-bold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center p-6 text-gray-500 text-sm">A carregar...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-6 text-gray-500 text-sm">Nenhum funcionário registado</td></tr>
              ) : employees.map(u => (
                <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!u.ativo ? 'opacity-50' : ''}`}>
                  <td className="p-3 text-sm font-bold text-gray-800">{u.nome}</td>
                  <td className="p-3 text-sm text-gray-600">{u.email || '-'}</td>
                  <td className="p-3 text-sm text-gray-600">{u.telefone || '-'}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${roleColors[u.role] || 'bg-gray-100'}`}>
                      {roleLabels[u.role] || u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${u.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(u)} className="text-brand hover:text-brand-dark text-xs font-medium mr-3">Editar</button>
                    <button onClick={() => handleToggleActive(u)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nome *" value={form.nome}
                onChange={e => setForm({...form, nome: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              <input type="text" placeholder="Telefone" value={form.telefone}
                onChange={e => setForm({...form, telefone: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                <option value="instructor">Instrutor</option>
                <option value="recepcionista">Rececionista</option>
                <option value="admin">Administrador</option>
              </select>
              {!editingId && (
                <input type="password" placeholder="Senha *" value={form.senha}
                  onChange={e => setForm({...form, senha: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              )}
              {editingId && (
                <input type="password" placeholder="Nova senha (deixar vazio para manter)" value={form.senha}
                  onChange={e => setForm({...form, senha: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 font-bold py-2.5 rounded-lg text-sm">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold py-2.5 rounded-lg text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </BackofficeLayout>
  );
}