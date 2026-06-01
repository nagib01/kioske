import { useState, useEffect } from 'react';
import BackofficeLayout from '../../../components/BackofficeLayout';

type Car = {
  id: string;
  matricula: string;
  marca: string;
  modelo: string;
  ano?: number;
  categoria: string;
  observacoes?: string;
  ativo: boolean;
};

type CarForm = {
  matricula: string;
  marca: string;
  modelo: string;
  ano?: number;
  categoria: string;
  observacoes: string;
};

const emptyCar: CarForm = { matricula: '', marca: '', modelo: '', ano: undefined, categoria: 'B', observacoes: '' };

export default function AdminViaturas() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCar);

  const api = (path: string) => `${process.env.NEXT_PUBLIC_API_URL}${path}`;

  const fetchCars = async () => {
    const token = localStorage.getItem('backoffice_token');
    const res = await fetch(api('/admin/cars'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setCars(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchCars(); }, []);

  const openCreate = () => {
    setForm(emptyCar);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (car: Car) => {
    setForm({ matricula: car.matricula, marca: car.marca, modelo: car.modelo, ano: car.ano, categoria: car.categoria, observacoes: car.observacoes || '' });
    setEditingId(car.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('backoffice_token');
    const base = api('/admin/cars');
    const url = editingId ? `${base}/${editingId}` : base;
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      fetchCars();
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao salvar viatura');
    }
  };

  const handleToggleActive = async (car: Car) => {
    const token = localStorage.getItem('backoffice_token');
    const res = await fetch(api(`/admin/cars/${car.id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchCars();
  };

  return (
    <BackofficeLayout activeRoute="/admin/viaturas" title="Viaturas | Backoffice">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Viaturas</h1>
          <button onClick={openCreate} className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
            + Nova Viatura
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-3 text-xs font-bold text-gray-600">Matrícula</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Marca</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Modelo</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Ano</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Categoria</th>
                <th className="text-left p-3 text-xs font-bold text-gray-600">Estado</th>
                <th className="text-right p-3 text-xs font-bold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-500 text-sm">A carregar...</td></tr>
              ) : cars.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-500 text-sm">Nenhuma viatura registada</td></tr>
              ) : cars.map(c => (
                <tr key={c.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!c.ativo ? 'opacity-50' : ''}`}>
                  <td className="p-3 text-sm font-bold text-gray-800">{c.matricula}</td>
                  <td className="p-3 text-sm text-gray-600">{c.marca}</td>
                  <td className="p-3 text-sm text-gray-600">{c.modelo}</td>
                  <td className="p-3 text-sm text-gray-600">{c.ano || '-'}</td>
                  <td className="p-3 text-sm"><span className="font-bold text-[#047857]">{c.categoria}</span></td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${c.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(c)} className="text-[#047857] hover:text-[#065f46] text-xs font-medium mr-3">Editar</button>
                    <button onClick={() => handleToggleActive(c)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                      {c.ativo ? 'Desativar' : 'Ativar'}
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
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Editar Viatura' : 'Nova Viatura'}</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Matrícula *" value={form.matricula}
                onChange={e => setForm({...form, matricula: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Marca *" value={form.marca}
                  onChange={e => setForm({...form, marca: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                <input type="text" placeholder="Modelo *" value={form.modelo}
                  onChange={e => setForm({...form, modelo: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Ano" value={form.ano || ''}
                  onChange={e => setForm({...form, ano: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm">
                  <option value="A">A - Motorizada</option>
                  <option value="B">B - Ligeiros</option>
                  <option value="C">C - Pesados</option>
                  <option value="D">D - Transporte</option>
                  <option value="BE">BE - Ligeiros c/ Reboque</option>
                  <option value="CE">CE - Pesados c/ Reboque</option>
                </select>
              </div>
              <textarea placeholder="Observações" value={form.observacoes}
                onChange={e => setForm({...form, observacoes: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" rows={2} />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 font-bold py-2.5 rounded-lg text-sm">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-[#047857] hover:bg-[#065f46] text-white font-bold py-2.5 rounded-lg text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </BackofficeLayout>
  );
}
