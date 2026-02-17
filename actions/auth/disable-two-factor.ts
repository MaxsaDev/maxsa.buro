'use server';

import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { pool } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Екшен для відключення 2FA користувача
 * Доступно тільки для адміністраторів
 */
export const disableTwoFactor = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Перевірка авторизації та прав адміністратора
    const currentUser = (await getCurrentUser()) as ExtendedUser | null;

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Недостатньо прав для виконання цієї дії' };
    }

    // Перевіряємо, чи увімкнено 2FA у користувача
    const userResult = await pool.query('SELECT "twoFactorEnabled" FROM "user" WHERE id = $1', [
      userId,
    ]);

    if (userResult.rowCount === 0) {
      return { success: false, error: 'Користувача не знайдено' };
    }

    if (!userResult.rows[0].twoFactorEnabled) {
      return { success: false, error: 'У користувача вже відключено 2FA' };
    }

    // Відключаємо 2FA: видаляємо секрет та скидаємо прапорець
    await pool.query(
      'UPDATE "user" SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL WHERE id = $1',
      [userId]
    );

    revalidatePath('/mx-admin/users');

    return { success: true };
  } catch (error) {
    console.error('[Action] Помилка відключення 2FA:', error);
    return { success: false, error: 'Не вдалося відключити 2FA' };
  }
};
