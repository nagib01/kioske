import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { apiUrl } from '../lib/api';
import { backofficeHeaders } from '../lib/auth';

type Id = string | string[] | undefined;

export interface NewContact {
  nome: string;
  parentesco: string;
  telefone: string;
  email: string;
}

export interface NewLesson {
  tipo: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  car_id: string;
  summary: string;
  status: string;
}

/**
 * Owns the student-profile data (profile, tickets, lessons, contacts, cars) and
 * the related CRUD actions. Extracted from the old monolithic
 * `admin/alunos/[id]/index.tsx` (see REFACTOR_PLAN, Phase 3).
 */
export function useStudentProfile(id: Id) {
  const { addToast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = () => backofficeHeaders({ escola: true });

  const fetchStudent = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(apiUrl(`/admin/students/${id}`), { headers: headers() });
      if (res.ok) setStudent(await res.json());
    } catch {}
  }, [id]);

  const fetchTickets = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(apiUrl(`/admin/students/${id}/tickets`), { headers: headers() });
      if (res.ok) setTickets(await res.json());
    } catch {}
  }, [id]);

  const fetchLessons = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(apiUrl(`/admin/students/${id}/lessons`), { headers: headers() });
      if (res.ok) setLessons(await res.json());
    } catch {}
  }, [id]);

  const fetchContacts = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(apiUrl(`/admin/students/${id}/contacts`), { headers: headers() });
      if (res.ok) setContacts(await res.json());
    } catch {}
  }, [id]);

  const fetchCars = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/admin/cars'), { headers: headers() });
      if (res.ok) setCars(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchStudent(), fetchTickets(), fetchLessons(), fetchContacts(), fetchCars()]).finally(() =>
      setLoading(false),
    );
  }, [id, fetchStudent, fetchTickets, fetchLessons, fetchContacts, fetchCars]);

  const addContact = async (contact: NewContact): Promise<boolean> => {
    if (!contact.nome) {
      addToast('Nome é obrigatório', 'warning');
      return false;
    }
    try {
      const res = await fetch(apiUrl(`/admin/students/${id}/contacts`), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(contact),
      });
      if (!res.ok) throw new Error('Falha ao adicionar contacto');
      await fetchContacts();
      return true;
    } catch (err: any) {
      addToast(err.message, 'error');
      return false;
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!window.confirm('Remover este contacto?')) return;
    try {
      await fetch(apiUrl(`/admin/students/contacts/${contactId}`), { method: 'DELETE', headers: headers() });
      await fetchContacts();
    } catch {}
  };

  const addLesson = async (lesson: NewLesson): Promise<boolean> => {
    if (!lesson.data) {
      addToast('Data é obrigatória', 'warning');
      return false;
    }
    if (!lesson.hora_inicio || !lesson.hora_fim) {
      addToast('Hora de início e fim são obrigatórias', 'warning');
      return false;
    }
    try {
      const res = await fetch(apiUrl(`/admin/students/${id}/lessons`), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(lesson),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao adicionar aula');
      }
      await fetchLessons();
      return true;
    } catch (err: any) {
      addToast(err.message, 'error');
      return false;
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!window.confirm('Remover esta aula?')) return;
    try {
      await fetch(apiUrl(`/admin/students/lessons/${lessonId}`), { method: 'DELETE', headers: headers() });
      await fetchLessons();
    } catch {}
  };

  const associateTicket = async (ticketId: string): Promise<boolean> => {
    if (!ticketId) {
      addToast('ID do ticket é obrigatório', 'warning');
      return false;
    }
    try {
      const res = await fetch(apiUrl(`/admin/students/${id}/tickets`), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ ticketId }),
      });
      if (!res.ok) throw new Error('Falha ao associar ticket');
      await fetchTickets();
      return true;
    } catch (err: any) {
      addToast(err.message, 'error');
      return false;
    }
  };

  return {
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
  };
}
