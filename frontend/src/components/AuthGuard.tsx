import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const STAFF_PORT = parseInt(process.env.NEXT_PUBLIC_STAFF_PORT || '3002', 10);

function getArea(): 'public' | 'staff' {
  if (typeof window === 'undefined') return 'public';
  return window.location.port === String(STAFF_PORT) ? 'staff' : 'public';
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const area = getArea();

    if (area === 'public') {
      setIsAuthenticated(true);
      return;
    }

    const token = localStorage.getItem('backoffice_token');
    if (!token && router.pathname !== '/login') {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router.pathname]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center bg-surface">A carregar...</div>;
  }

  return <>{children}</>;
}