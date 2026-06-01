import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const backofficePaths = ['/backoffice', '/admin'];

  // List of paths that don't require authentication
  const publicPaths = ['/login', '/aluno', '/servicos', '/chamadas', '/_error'];

  // Paths that require student auth specifically
  const studentPaths = ['/aluno/conta'];

  useEffect(() => {
    const path = router.pathname;
    // Public pages always render
    if (publicPaths.some(p => path.startsWith(p) || path === '/')) {
      setIsAuthenticated(true);
      return;
    }

    // Student auth pages check
    if (studentPaths.some(p => path.startsWith(p))) {
      const studentToken = localStorage.getItem('kioske_student_access_token');
      if (!studentToken) {
        router.push('/aluno/login');
        return;
      }
      setIsAuthenticated(true);
      return;
    }

    // Backoffice pages check
    const token = localStorage.getItem('backoffice_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router.pathname]);

  if (isAuthenticated === null) {
    // Optional: add a global loading spinner here
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">A carregar...</div>;
  }

  return <>{children}</>;
}
