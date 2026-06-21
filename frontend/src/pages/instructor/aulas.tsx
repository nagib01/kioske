import { useState } from 'react';
import InstructorLayout from '../../components/InstructorLayout';
import { useInstructorLessons } from '../../hooks/useInstructorLessons';
import LessonsTable from '../../components/instructor/LessonsTable';
import LessonFormModal from '../../components/instructor/LessonFormModal';

export default function InstructorAulas() {
  const {
    lessons,
    students,
    cars,
    loading,
    statusFilter,
    setStatusFilter,
    saveLesson,
    deleteLesson,
    updateStatus,
  } = useInstructorLessons();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (lesson: any) => {
    setEditing(lesson);
    setShowForm(true);
  };

  return (
    <InstructorLayout title="Minhas Aulas | Instrutor">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Minhas Aulas</h1>
          <button onClick={openNew}
            className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
            + Nova Aula
          </button>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg p-2.5 text-sm">
            <option value="">Todos os estados</option>
            <option value="agendada">Agendada</option>
            <option value="em_curso">Em Curso</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <LessonsTable
          lessons={lessons}
          loading={loading}
          onEdit={openEdit}
          onDelete={deleteLesson}
          onUpdateStatus={updateStatus}
        />

        {showForm && (
          <LessonFormModal
            editing={editing}
            students={students}
            cars={cars}
            onClose={() => setShowForm(false)}
            onSave={saveLesson}
          />
        )}
      </div>
    </InstructorLayout>
  );
}
