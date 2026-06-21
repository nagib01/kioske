import { useCallback, useState } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { useToast } from '../components/Toast';
import { apiUrl } from '../lib/api';

export interface Aula {
  id: string;
  tipo: string;
  data: string;
  hora_inicio?: string;
  hora_fim?: string;
  car_matricula?: string;
  instructor_nome?: string;
  summary?: string;
  status: string;
  tipo_registo?: string;
}

export interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem?: string;
  lesson_id?: string;
  lida: boolean;
  created_at: string;
}

/**
 * Owns the student-account data (lessons, notifications) and the
 * 401-refreshing fetch used by the BYOD portal. Extracted from the old
 * monolithic `aluno/conta.tsx` (see REFACTOR_PLAN, Phase 3).
 */
export function useStudentAccount() {
  const { student, getAccessToken, refreshSession } = useStudentAuth();
  const { addToast } = useToast();

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregandoAulas, setCarregandoAulas] = useState(false);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);

  const authHeaders = useCallback(() => {
    const token = getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [getAccessToken]);

  const fetchWithAuth = useCallback(
    async (url: string): Promise<Response | null> => {
      const res = await fetch(url, { headers: authHeaders() });
      if (res.status === 401) {
        const refreshed = await refreshSession();
        if (refreshed) {
          return fetch(url, { headers: authHeaders() });
        }
        return null;
      }
      return res;
    },
    [authHeaders, refreshSession],
  );

  const fetchAulas = useCallback(async () => {
    if (!student) return;
    setCarregandoAulas(true);
    try {
      const res = await fetchWithAuth(apiUrl('/api/auth/student/lessons'));
      if (res && res.ok) setAulas(await res.json());
    } catch {
      addToast('Erro ao carregar aulas', 'error');
    } finally {
      setCarregandoAulas(false);
    }
  }, [student, fetchWithAuth, addToast]);

  const fetchNotificacoes = useCallback(async () => {
    if (!student) return;
    setCarregandoNotificacoes(true);
    try {
      const res = await fetchWithAuth(apiUrl('/api/auth/student/notifications'));
      if (res && res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setNaoLidas(data.naoLidas || 0);
      }
    } catch {
    } finally {
      setCarregandoNotificacoes(false);
    }
  }, [student, fetchWithAuth]);

  const marcarLida = async (id: string) => {
    await fetch(apiUrl(`/api/auth/student/notifications/${id}/read`), {
      method: 'PUT',
      headers: authHeaders(),
    });
    fetchNotificacoes();
  };

  const marcarTodasLidas = async () => {
    await fetch(apiUrl('/api/auth/student/notifications/read-all'), {
      method: 'PUT',
      headers: authHeaders(),
    });
    fetchNotificacoes();
  };

  return {
    aulas,
    notifications,
    naoLidas,
    carregandoAulas,
    carregandoNotificacoes,
    fetchAulas,
    fetchNotificacoes,
    marcarLida,
    marcarTodasLidas,
  };
}
