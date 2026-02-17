import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { getUserPasskeysForDisplay } from '@/lib/auth/passkey/passkey';

/**
 * GET /api/passkey/list
 * Отримання списку passkeys користувача
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Не авторизований' }, { status: 401 });
    }

    const passkeys = await getUserPasskeysForDisplay(user.id);

    return NextResponse.json({
      passkeys,
      count: passkeys.length,
    });
  } catch (error) {
    console.error('[API] Passkey list error:', error);
    return NextResponse.json({ error: 'Помилка завантаження passkeys' }, { status: 500 });
  }
}
