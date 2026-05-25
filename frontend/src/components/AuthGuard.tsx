import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // List of paths that don't require authentication
  const publicPaths = ['/login', '/aluno', '/servicos', '/chamadas', '/_error'];

  useEffect(() => {
    // Check if the current path is public
    const path = router.pathname;
    if (publicPaths.some(p => path.startsWith(p) || path === '/')) {
      setIsAuthenticated(true); // Don't block render for public pages
      return;
    }

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
