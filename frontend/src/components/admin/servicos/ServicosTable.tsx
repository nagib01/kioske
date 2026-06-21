import type { Servico } from '../../../hooks/useServicos';

interface ServicosTableProps {
  servicos: Servico[];
  onEdit: (servico: Servico) => void;
  onDelete: (id: string) => void;
}

export default function ServicosTable({ servicos, onEdit, onDelete }: ServicosTableProps) {
  return (
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
                    ? servico.mesas.map((m) => `M${m}`).join(', ')
                    : servico.mesa_padrao || '01'}
                </td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${servico.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {servico.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <button onClick={() => onEdit(servico)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                  <button onClick={() => onDelete(servico.id)} className="text-red-600 hover:text-red-800 font-medium">Desativar</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
