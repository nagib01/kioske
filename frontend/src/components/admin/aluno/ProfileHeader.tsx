import Link from 'next/link';

const ESTADOS_FORMACAO: Record<string, string> = {
  inscrito: 'Inscrito', em_formacao: 'Em Formação', teorico_concluido: 'Teórico Concluído',
  pratico_concluido: 'Prático Concluído', aprovado: 'Aprovado', reprovado: 'Reprovado', suspenso: 'Suspenso',
};

const estadoBadge = (estado: string) => {
  const colors: Record<string, string> = {
    inscrito: 'bg-blue-100 text-blue-800', em_formacao: 'bg-yellow-100 text-yellow-800',
    teorico_concluido: 'bg-purple-100 text-purple-800', pratico_concluido: 'bg-indigo-100 text-indigo-800',
    aprovado: 'bg-green-100 text-green-800', reprovado: 'bg-red-100 text-red-800', suspenso: 'bg-gray-100 text-gray-800',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
};

interface ProfileHeaderProps {
  student: any;
  id: string | string[] | undefined;
}

export default function ProfileHeader({ student, id }: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white text-2xl font-bold">
            {student.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{student.nome}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">#{student.numero_estudante}</span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${estadoBadge(student.estado_formacao)}`}>
                {ESTADOS_FORMACAO[student.estado_formacao] || student.estado_formacao}
              </span>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                Categoria {student.categoria}
              </span>
              {!student.ativo && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                  Inativo
                </span>
              )}
            </div>
          </div>
        </div>
        <Link href={`/alunos/${id}/editar`}
          className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div><p className="text-xs text-gray-500 font-medium">Email</p><p className="text-sm text-gray-800">{student.email || '-'}</p></div>
        <div><p className="text-xs text-gray-500 font-medium">Telefone</p><p className="text-sm text-gray-800">{student.telefone || '-'}</p></div>
        <div><p className="text-xs text-gray-500 font-medium">Data Nascimento</p><p className="text-sm text-gray-800">{student.data_nascimento ? new Date(student.data_nascimento).toLocaleDateString('pt-PT') : '-'}</p></div>
        <div><p className="text-xs text-gray-500 font-medium">Documento</p><p className="text-sm text-gray-800">{student.documento_identificacao || '-'}</p></div>
        <div><p className="text-xs text-gray-500 font-medium">Data Matrícula</p><p className="text-sm text-gray-800">{student.data_matricula ? new Date(student.data_matricula).toLocaleDateString('pt-PT') : '-'}</p></div>
        <div><p className="text-xs text-gray-500 font-medium">Total Tickets</p><p className="text-sm text-gray-800">{student.total_tickets || 0}</p></div>
        <div><p className="text-xs text-gray-500 font-medium">Tickets Concluídos</p><p className="text-sm text-gray-800">{student.tickets_concluidos || 0}</p></div>
        <div><p className="text-xs text-gray-500 font-medium">Aulas Realizadas</p><p className="text-sm text-gray-800">{student.aulas_realizadas || 0}</p></div>
      </div>

      {student.endereco && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Endereço</p>
          <p className="text-sm text-gray-800">{student.endereco}</p>
        </div>
      )}
      {student.observacoes && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Observações</p>
          <p className="text-sm text-gray-800">{student.observacoes}</p>
        </div>
      )}
    </div>
  );
}
