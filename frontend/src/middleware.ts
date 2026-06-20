import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type Area = 'kioske' | 'monitor' | 'student' | 'staff' | 'landing';

type Resolution =
  | { kind: 'next' }
  | { kind: 'rewrite'; to: string }
  | { kind: 'redirect'; to: string }
  | { kind: 'invalid' };

const STAFF_SECTIONS = [
  'fila',
  'alunos',
  'funcionarios',
  'aulas',
  'viaturas',
  'servicos',
  'questionarios',
  'instrutores',
];

function firstSegment(pathname: string): string {
  return pathname.split('/')[1] || '';
}

function resolveKioske(pathname: string): Resolution {
  if (pathname === '/') return { kind: 'rewrite', to: '/servicos' };
  if (pathname === '/servicos') return { kind: 'next' };
  if (pathname === '/aluno' || pathname.startsWith('/aluno/')) return { kind: 'next' };
  return { kind: 'invalid' };
}

function resolveMonitor(pathname: string): Resolution {
  if (pathname === '/chamadas') return { kind: 'redirect', to: '/' };
  if (pathname === '/') return { kind: 'rewrite', to: '/chamadas' };
  return { kind: 'invalid' };
}

function resolveLanding(pathname: string): Resolution {
  if (pathname === '/landing') return { kind: 'redirect', to: '/' };
  if (pathname === '/') return { kind: 'rewrite', to: '/landing' };
  return { kind: 'invalid' };
}

function resolveStudent(pathname: string): Resolution {
  if (pathname === '/aluno/conta' || pathname.startsWith('/aluno/conta/')) {
    return { kind: 'redirect', to: '/' };
  }
  if (pathname === '/aluno/login') return { kind: 'redirect', to: '/login' };
  if (pathname === '/') return { kind: 'rewrite', to: '/aluno/conta' };
  if (pathname === '/login') return { kind: 'rewrite', to: '/aluno/login' };
  return { kind: 'invalid' };
}

function resolveStaff(pathname: string): Resolution {
  if (pathname === '/backoffice' || pathname.startsWith('/backoffice/')) {
    return { kind: 'redirect', to: pathname.replace(/^\/backoffice/, '') || '/' };
  }
  if (pathname.startsWith('/admin/') && STAFF_SECTIONS.includes(pathname.split('/')[2] || '')) {
    return { kind: 'redirect', to: pathname.replace(/^\/admin/, '') };
  }
  if (pathname === '/instructor' || pathname.startsWith('/instructor/')) {
    return { kind: 'redirect', to: pathname.replace(/^\/instructor/, '/instrutor') };
  }

  if (pathname === '/') return { kind: 'rewrite', to: '/backoffice' };
  if (pathname === '/login') return { kind: 'next' };
  if (pathname === '/instrutor' || pathname.startsWith('/instrutor/')) {
    return { kind: 'rewrite', to: pathname.replace(/^\/instrutor/, '/instructor') };
  }
  if (STAFF_SECTIONS.includes(firstSegment(pathname))) {
    return { kind: 'rewrite', to: '/admin' + pathname };
  }
  return { kind: 'invalid' };
}

const RESOLVERS: Record<Area, (pathname: string) => Resolution> = {
  kioske: resolveKioske,
  monitor: resolveMonitor,
  landing: resolveLanding,
  student: resolveStudent,
  staff: resolveStaff,
};

export function middleware(request: NextRequest) {
  const area = (request.headers.get('x-app-area') || 'kioske') as Area;
  const resolve = RESOLVERS[area] || resolveKioske;
  const result = resolve(request.nextUrl.pathname);

  if (result.kind === 'redirect') {
    const url = request.nextUrl.clone();
    url.pathname = result.to;
    return NextResponse.redirect(url);
  }

  if (result.kind === 'invalid') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (result.kind === 'rewrite') {
    const url = request.nextUrl.clone();
    url.pathname = result.to;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)'],
};
