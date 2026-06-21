import { useState } from 'react';
import BackofficeLayout from '../../components/BackofficeLayout';
import { useQuestionarios, type Pergunta } from '../../hooks/useQuestionarios';
import QuestionariosTable from '../../components/admin/questionarios/QuestionariosTable';
import PerguntaModal from '../../components/admin/questionarios/PerguntaModal';

export default function AdminQuestionariosPage() {
  const { perguntas, servicos, loading, error, savePergunta, deletePergunta } = useQuestionarios();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pergunta | null>(null);

  const openNewModal = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pergunta: Pergunta) => {
    setEditing(pergunta);
    setIsModalOpen(true);
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
          <QuestionariosTable
            perguntas={perguntas}
            servicos={servicos}
            onEdit={openEditModal}
            onDelete={deletePergunta}
          />
        )}
      </div>

      {isModalOpen && (
        <PerguntaModal
          editing={editing}
          servicos={servicos}
          onClose={() => setIsModalOpen(false)}
          onSave={savePergunta}
        />
      )}
    </BackofficeLayout>
  );
}
