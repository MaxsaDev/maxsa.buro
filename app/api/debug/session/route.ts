import { NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers';

import { getSession, getCurrentUser } from '@/lib/auth/auth-server';
import { pool } from '@/lib/db';

/**
 * DEBUG endpoint для перевірки сесії
 * GET /api/debug/session
 */
export async function GET() {
  try {
    const headersList = await headers();
    const cookieStore = await cookies();

    // Отримуємо всі cookies
    const allCookies = cookieStore.getAll();
    const sessionCookie = cookieStore.get('better-auth.session_token');

    // Отримуємо сесію через Better Auth
    const session = await getSession();
    const user = await getCurrentUser();

    // Перевіряємо сесію в БД напряму
    let dbSession = null;
    if (sessionCookie?.value) {
      const result = await pool.query(
        'SELECT id, "userId", "expiresAt", "ipAddress", "userAgent" FROM session WHERE token = $1',
        [sessionCookie.value]
      );
      dbSession = result.rows[0] || null;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookies: {
        all: allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
        sessionCookie: sessionCookie ? { exists: true, length: sessionCookie.value.length } : null,
      },
      headers: {
        userAgent: headersList.get('user-agent'),
        cookie: headersList.get('cookie') ? 'EXISTS' : null,
      },
      betterAuth: {
        session: session ? { exists: true, userId: session.user?.id } : null,
        user: user ? { exists: true, id: user.id, email: user.email } : null,
      },
      database: {
        session: dbSession
          ? {
              exists: true,
              userId: dbSession.userId,
              expiresAt: dbSession.expiresAt,
              expired: new Date(dbSession.expiresAt) < new Date(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[Debug] Session check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check session',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
