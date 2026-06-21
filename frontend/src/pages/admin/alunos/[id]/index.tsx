import { useState } from 'react';
import { useRouter } from 'next/router';
import BackofficeLayout from '../../../../components/BackofficeLayout';
import { useStudentProfile } from '../../../../hooks/useStudentProfile';
import ProfileHeader from '../../../../components/admin/aluno/ProfileHeader';
import PerfilTab from '../../../../components/admin/aluno/PerfilTab';
import TicketsTab from '../../../../components/admin/aluno/TicketsTab';
import AulasTab from '../../../../components/admin/aluno/AulasTab';
import ContactosTab from '../../../../components/admin/aluno/ContactosTab';

type Tab = 'perfil' | 'tickets' | 'aulas' | 'contactos';

export default function AlunoProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState<Tab>('perfil');

  const {
    student,
    tickets,
    lessons,
    contacts,
    cars,
    loading,
    addContact,
    deleteContact,
    addLesson,
    deleteLesson,
    associateTicket,
  } = useStudentProfile(id);

  if (loading) {
    return (
      <BackofficeLayout activeRoute="/alunos" title="Aluno | Kioske Digital">
        <div className="p-8 text-center text-gray-500">Carregando...</div>
      </BackofficeLayout>
    );
  }

  if (!student) {
    return (
      <BackofficeLayout activeRoute="/alunos" title="Aluno | Kioske Digital">
        <div className="p-8 text-center text-gray-500">Aluno não encontrado</div>
      </BackofficeLayout>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'tickets', label: 'Histórico de Senhas', count: tickets.length },
    { key: 'aulas', label: 'Aulas', count: lessons.length },
    { key: 'contactos', label: 'Contactos', count: contacts.length },
  ];

  return (
    <BackofficeLayout activeRoute="/alunos" title={`${student.nome} | Kioske Digital`}>
      <div className="p-8 max-w-6xl mx-auto w-full">
        <ProfileHeader student={student} id={id} />

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              {tab.count !== undefined && <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'perfil' && <PerfilTab student={student} />}
        {activeTab === 'tickets' && <TicketsTab tickets={tickets} onAssociate={associateTicket} />}
        {activeTab === 'aulas' && <AulasTab lessons={lessons} cars={cars} onAdd={addLesson} onDelete={deleteLesson} />}
        {activeTab === 'contactos' && <ContactosTab contacts={contacts} onAdd={addContact} onDelete={deleteContact} />}
      </div>
    </BackofficeLayout>
  );
}
