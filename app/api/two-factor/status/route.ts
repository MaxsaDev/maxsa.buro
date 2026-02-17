import { NextResponse } from 'next/server';

import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * GET /api/two-factor/status
 * Отримати статус 2FA для поточного користувача
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Отримуємо статус 2FA з БД
    const result = await pool.query('SELECT "twoFactorEnabled" FROM "user" WHERE id = $1', [
      user.id,
    ]);

    const enabled = result.rows[0]?.twoFactorEnabled ?? false;

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('[API 2FA Status] Помилка:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
