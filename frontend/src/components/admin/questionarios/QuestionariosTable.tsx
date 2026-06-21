import type { Pergunta, Servico } from '../../../hooks/useQuestionarios';

interface QuestionariosTableProps {
  perguntas: Pergunta[];
  servicos: Servico[];
  onEdit: (pergunta: Pergunta) => void;
  onDelete: (id: string) => void;
}

export default function QuestionariosTable({ perguntas, servicos, onEdit, onDelete }: QuestionariosTableProps) {
  const getServicoNome = (id: string | null) => {
    if (!id) return 'Global (Todos)';
    const servico = servicos.find((s) => s.id === id);
    return servico ? servico.nome : 'Desconhecido';
  };

  return (
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
                  <button onClick={() => onEdit(pergunta)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                  <button onClick={() => onDelete(pergunta.id)} className="text-red-600 hover:text-red-800 font-medium">Desativar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
