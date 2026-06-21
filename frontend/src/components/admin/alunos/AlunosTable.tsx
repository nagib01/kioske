import Link from 'next/link';
import type { AlunoListItem } from '../../../hooks/useAlunosList';
import { ESTADOS_FORMACAO } from './AlunosFilters';

const estadoBadge = (estado: string) => {
  const colors: Record<string, string> = {
    inscrito: 'bg-blue-100 text-blue-800',
    em_formacao: 'bg-yellow-100 text-yellow-800',
    teorico_concluido: 'bg-purple-100 text-purple-800',
    pratico_concluido: 'bg-indigo-100 text-indigo-800',
    aprovado: 'bg-green-100 text-green-800',
    reprovado: 'bg-red-100 text-red-800',
    suspenso: 'bg-gray-100 text-gray-800',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
};

interface AlunosTableProps {
  students: AlunoListItem[];
  loading: boolean;
  page: number;
  total: number;
  totalPages: number;
  onDelete: (id: string, nome: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function AlunosTable({ students, loading, page, total, totalPages, onDelete, onPrev, onNext }: AlunosTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-4 text-sm font-bold text-gray-600">Nº</th>
              <th className="text-left p-4 text-sm font-bold text-gray-600">Nome</th>
              <th className="text-left p-4 text-sm font-bold text-gray-600">Email</th>
              <th className="text-left p-4 text-sm font-bold text-gray-600">Telefone</th>
              <th className="text-left p-4 text-sm font-bold text-gray-600">Categoria</th>
              <th className="text-left p-4 text-sm font-bold text-gray-600">Estado</th>
              <th className="text-left p-4 text-sm font-bold text-gray-600">Tickets</th>
              <th className="text-right p-4 text-sm font-bold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center p-8 text-gray-500">Carregando...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={8} className="text-center p-8 text-gray-500">Nenhum aluno encontrado</td></tr>
            ) : students.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm font-mono text-gray-600">{s.numero_estudante}</td>
                <td className="p-4">
                  <Link href={`/alunos/${s.id}`} className="font-medium text-brand hover:underline">
                    {s.nome}
                  </Link>
                </td>
                <td className="p-4 text-sm text-gray-600">{s.email || '-'}</td>
                <td className="p-4 text-sm text-gray-600">{s.telefone || '-'}</td>
                <td className="p-4 text-sm font-bold text-gray-700">{s.categoria}</td>
                <td className="p-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${estadoBadge(s.estado_formacao)}`}>
                    {ESTADOS_FORMACAO[s.estado_formacao] || s.estado_formacao}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">{s.total_tickets || 0}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/alunos/${s.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Perfil
                    </Link>
                    <Link href={`/alunos/${s.id}/editar`}
                      className="text-brand hover:text-brand-dark text-sm font-medium">
                      Editar
                    </Link>
                    <button onClick={() => onDelete(s.id, s.nome)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium">
                      Desativar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">Total: {total} alunos</p>
          <div className="flex gap-2">
            <button onClick={onPrev} disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50">
              Anterior
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">Página {page} de {totalPages}</span>
            <button onClick={onNext} disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-50">
              Seguinte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
