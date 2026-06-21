import Link from 'next/link';
import BackofficeLayout from '../../../components/BackofficeLayout';
import { useAlunosList } from '../../../hooks/useAlunosList';
import AlunosDashboard from '../../../components/admin/alunos/AlunosDashboard';
import AlunosFilters from '../../../components/admin/alunos/AlunosFilters';
import AlunosTable from '../../../components/admin/alunos/AlunosTable';

export default function AdminAlunosPage() {
  const {
    students,
    dashboard,
    loading,
    search,
    categoria,
    estado,
    page,
    total,
    totalPages,
    onSearchChange,
    onCategoriaChange,
    onEstadoChange,
    clearFilters,
    prevPage,
    nextPage,
    deleteStudent,
  } = useAlunosList();

  return (
    <BackofficeLayout activeRoute="/alunos" title="Alunos | Kioske Digital">
      <div className="p-8 max-w-7xl mx-auto w-full">
        {dashboard && <AlunosDashboard dashboard={dashboard} />}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Alunos</h2>
          <Link
            href="/alunos/novo"
            className="bg-brand hover:bg-brand-dark text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
          >
            + Novo Aluno
          </Link>
        </div>

        <AlunosFilters
          search={search}
          categoria={categoria}
          estado={estado}
          onSearchChange={onSearchChange}
          onCategoriaChange={onCategoriaChange}
          onEstadoChange={onEstadoChange}
          onClear={clearFilters}
        />

        <AlunosTable
          students={students}
          loading={loading}
          page={page}
          total={total}
          totalPages={totalPages}
          onDelete={deleteStudent}
          onPrev={prevPage}
          onNext={nextPage}
        />
      </div>
    </BackofficeLayout>
  );
}
