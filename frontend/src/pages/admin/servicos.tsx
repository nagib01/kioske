import { useState } from 'react';
import BackofficeLayout from '../../components/BackofficeLayout';
import { useServicos, type Servico } from '../../hooks/useServicos';
import ServicosTable from '../../components/admin/servicos/ServicosTable';
import ServicoModal from '../../components/admin/servicos/ServicoModal';

export default function AdminServicosPage() {
  const { servicos, loading, error, saveServico, deleteServico } = useServicos();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);

  const openNewModal = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEditModal = (servico: Servico) => {
    setEditing(servico);
    setIsModalOpen(true);
  };

  return (
    <BackofficeLayout activeRoute="/servicos" title="Administração - Serviços | Kioske Digital">
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800">Gerir Serviços</h2>
          <button
            onClick={openNewModal}
            className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
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
          <ServicosTable servicos={servicos} onEdit={openEditModal} onDelete={deleteServico} />
        )}
      </div>

      {isModalOpen && (
        <ServicoModal
          editing={editing}
          onClose={() => setIsModalOpen(false)}
          onSave={saveServico}
        />
      )}
    </BackofficeLayout>
  );
}
