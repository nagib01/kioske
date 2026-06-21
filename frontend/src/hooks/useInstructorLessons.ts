import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { apiUrl } from '../lib/api';
import { getBackofficeToken } from '../lib/auth';

export type Student = { id: string; nome: string; numero_estudante: string; categoria: string };
export type Car = { id: string; matricula: string; marca: string; modelo: string; categoria: string };

export interface LessonForm {
  student_id: string;
  tipo: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  car_id: string;
  summary: string;
  categoria: string;
}

/**
 * Owns the instructor lessons data (lessons, students, cars) and the related
 * actions. Extracted from the old monolithic `instructor/aulas.tsx`
 * (see REFACTOR_PLAN, Phase 3).
 */
export function useInstructorLessons() {
  const { addToast } = useToast();
  const [lessons, setLessons] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const authHeaders = (json = false): Record<string, string> => {
    const token = getBackofficeToken();
    return json
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { Authorization: `Bearer ${token}` };
  };

  const fetchLessons = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(apiUrl(`/api/instructor/lessons?${params}`), { headers: authHeaders() });
    if (res.ok) setLessons(await res.json());
    setLoading(false);
  }, [statusFilter]);

  const fetchStudents = useCallback(async () => {
    const res = await fetch(apiUrl('/api/instructor/students'), { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setStudents(data || []);
    }
  }, []);

  const fetchCars = useCallback(async () => {
    const res = await fetch(apiUrl('/api/instructor/cars'), { headers: authHeaders() });
    if (res.ok) setCars(await res.json());
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchCars();
  }, [fetchStudents, fetchCars]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const saveLesson = async (form: LessonForm, editingId: string | null): Promise<boolean> => {
    const base = apiUrl('/api/instructor/lessons');
    const url = editingId ? `${base}/${editingId}` : base;
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: authHeaders(true),
      body: JSON.stringify(form),
    });
    if (res.ok) {
      fetchLessons();
      return true;
    }
    const err = await res.json();
    addToast(err.error || 'Erro ao salvar aula', 'error');
    return false;
  };

  const deleteLesson = async (id: string) => {
    if (!confirm('Tem a certeza que deseja remover esta aula?')) return;
    const res = await fetch(apiUrl(`/api/instructor/lessons/${id}`), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) fetchLessons();
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(apiUrl(`/api/instructor/lessons/${id}`), {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchLessons();
  };

  return {
    lessons,
    students,
    cars,
    loading,
    statusFilter,
    setStatusFilter,
    saveLesson,
    deleteLesson,
    updateStatus,
  };
}
