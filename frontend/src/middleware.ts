import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type Area = 'kioske' | 'monitor' | 'student' | 'staff';

const AREA_ROUTES: Record<Area, { allowed: string[]; rootRedirect: string }> = {
  kioske: {
    allowed: ['/', '/servicos', '/aluno'],
    rootRedirect: '/servicos',
  },
  monitor: {
    allowed: ['/', '/chamadas'],
    rootRedirect: '/chamadas',
  },
  student: {
    allowed: ['/', '/aluno/conta', '/aluno/login'],
    rootRedirect: '/aluno/conta',
  },
  staff: {
    allowed: ['/', '/login', '/backoffice', '/admin', '/instructor'],
    rootRedirect: '/login',
  },
};

export function middleware(request: NextRequest) {
  const area = (request.headers.get('x-app-area') || 'kioske') as Area;
  const { pathname } = request.nextUrl;
  const config = AREA_ROUTES[area];

  if (pathname === '/') {
    return NextResponse.redirect(new URL(config.rootRedirect, request.url));
  }

  const allowed = config.allowed.some(route => pathname === route || pathname.startsWith(route + '/'));
  if (!allowed) {
    return NextResponse.redirect(new URL(config.rootRedirect, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)'],
};
