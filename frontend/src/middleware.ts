import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/servicos', '/chamadas', '/aluno'];
const STAFF_ROUTES = ['/login', '/backoffice', '/admin', '/instructor'];

export function middleware(request: NextRequest) {
  const area = request.headers.get('x-app-area') || 'public';
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isStaffRoute = STAFF_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));

  if (area === 'public' && isStaffRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (area === 'staff' && !isStaffRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)'],
};
