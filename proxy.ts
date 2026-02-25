import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Маршрути, які потребують аутентифікації
const protectedRoutes = ['/mx-job', '/profile', '/mx-admin', '/onboarding'];

/**
 * Proxy для базової перевірки авторизації
 *
 * ВАЖЛИВО:
 * - Тут перевіряємо тільки наявність session cookie
 * - НЕ перевіряємо валідність сесії (це робить Layout)
 * - НЕ редиректимо авторизованих з /login (може бути невалідна сесія)
 * - Повна перевірка прав відбувається в Server Components
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Перевіряємо чи це захищений маршрут
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Перевіряємо наявність Better Auth session cookie
  // В production Better Auth використовує __Secure- префікс
  const sessionCookie =
    request.cookies.get('__Secure-better-auth.session_token') ||
    request.cookies.get('better-auth.session_token');
  const hasSession = Boolean(sessionCookie);

  // Якщо користувач не авторизований і намагається зайти на захищений маршрут
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ПРИМІТКА:
  // - НЕ редиректимо з /login → /mx-job навіть якщо є cookie
  // - Причина: cookie може бути невалідним після logout
  // - Layout на /mx-job сам перенаправить на /login якщо сесія невалідна
  // - Перевірка ролі admin відбувається на самих сторінках (Server Components)

  return NextResponse.next();
}

/**
 * Конфігурація matcher для middleware.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
