import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useToast } from '../components/Toast';

interface Student {
  id: string;
  nome: string;
  email?: string;
  numero_estudante?: string;
  telefone?: string;
  escola_id: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

interface StudentAuthContextValue {
  student: Student | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  getAccessToken: () => string | null;
  changePassword: (senhaAtual: string, novaSenha: string) => Promise<void>;
  logoutAll: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextValue | null>(null);

const STORAGE_KEYS = {
  student: 'kioske_student',
  accessToken: 'kioske_student_access_token',
  refreshToken: 'kioske_student_refresh_token',
  expiresAt: 'kioske_student_expires_at',
};

function getStoredTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  const expiresAt = localStorage.getItem(STORAGE_KEYS.expiresAt);
  if (accessToken && refreshToken && expiresAt) {
    return { accessToken, refreshToken, expiresAt };
  }
  return null;
}

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
  localStorage.setItem(STORAGE_KEYS.expiresAt, tokens.expiresAt);
}

function clearStoredTokens() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
  localStorage.removeItem(STORAGE_KEYS.student);
}

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.student);
    const tokens = getStoredTokens();
    if (saved && tokens) {
      if (new Date(tokens.expiresAt) > new Date()) {
        fetchStudentProfile(tokens.accessToken).then(profile => {
          if (profile) {
            localStorage.setItem(STORAGE_KEYS.student, JSON.stringify(profile));
            setStudent(profile);
          } else {
            setStudent(JSON.parse(saved) as Student);
          }
        });
      } else {
        refreshTokens(tokens.refreshToken).then(success => {
          if (success) {
            const newTokens = getStoredTokens();
            if (newTokens?.accessToken) {
              fetchStudentProfile(newTokens.accessToken).then(profile => {
                if (profile) {
                  localStorage.setItem(STORAGE_KEYS.student, JSON.stringify(profile));
                  setStudent(profile);
                }
              });
            }
          } else {
            clearStoredTokens();
          }
        });
      }
    }
    setIsLoading(false);
  }, []);

  const refreshTokens = useCallback(async (refreshToken: string): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      storeTokens(data);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchStudentProfile = useCallback(async (accessToken: string): Promise<Student | null> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.student;
    } catch {
      return null;
    }
  }, []);

  const handleLoginResponse = useCallback(async (data: any) => {
    storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt: data.expiresAt });
    const profile = data.student;
    localStorage.setItem(STORAGE_KEYS.student, JSON.stringify(profile));
    setStudent(profile);
    return profile;
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
    await handleLoginResponse(data);
    addToast('Login efetuado com sucesso!', 'success');
  }, [handleLoginResponse, addToast]);

  const logout = useCallback(async () => {
    const tokens = getStoredTokens();
    if (tokens?.refreshToken) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      } catch {}
    }
    clearStoredTokens();
    setStudent(null);
    addToast('Sessão terminada', 'info');
  }, [addToast]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const tokens = getStoredTokens();
    if (!tokens?.refreshToken) return false;
    const success = await refreshTokens(tokens.refreshToken);
    if (!success) {
      clearStoredTokens();
      setStudent(null);
      return false;
    }
    const newTokens = getStoredTokens();
    if (newTokens?.accessToken) {
      const profile = await fetchStudentProfile(newTokens.accessToken);
      if (profile) {
        localStorage.setItem(STORAGE_KEYS.student, JSON.stringify(profile));
        setStudent(profile);
      }
    }
    return true;
  }, [refreshTokens, fetchStudentProfile]);

  const getAccessToken = useCallback((): string | null => {
    return getStoredTokens()?.accessToken || null;
  }, []);

  const changePassword = useCallback(async (senhaAtual: string, novaSenha: string): Promise<void> => {
    const token = getAccessToken();
    if (!token) throw new Error('Não autenticado');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao alterar senha');
  }, [getAccessToken]);

  const logoutAll = useCallback(async (): Promise<void> => {
    const tokens = getStoredTokens();
    if (student?.id) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/logout/all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: student.id }),
        });
      } catch {}
    }
    if (tokens?.refreshToken) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/student/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      } catch {}
    }
    clearStoredTokens();
    setStudent(null);
    addToast('Todas as sessões terminadas', 'info');
  }, [student, addToast, getAccessToken]);

  return (
    <StudentAuthContext.Provider value={{
      student,
      isAuthenticated: !!student,
      isLoading,
      login,
      logout,
      refreshSession,
      getAccessToken,
      changePassword,
      logoutAll,
    }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) throw new Error('useStudentAuth must be used within StudentAuthProvider');
  return ctx;
}
