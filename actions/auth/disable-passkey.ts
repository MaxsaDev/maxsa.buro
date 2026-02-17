'use server';

import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { pool } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Екшен для відключення всіх Passkey користувача
 * Доступно тільки для адміністраторів
 */
export const disablePasskey = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Перевірка авторизації та прав адміністратора
    const currentUser = (await getCurrentUser()) as ExtendedUser | null;

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Недостатньо прав для виконання цієї дії' };
    }

    // Перевіряємо, чи є у користувача Passkey
    const passkeyResult = await pool.query('SELECT COUNT(*) FROM passkey WHERE user_id = $1', [
      userId,
    ]);

    const passkeyCount = parseInt(passkeyResult.rows[0].count);

    if (passkeyCount === 0) {
      return { success: false, error: 'У користувача немає зареєстрованих Passkey' };
    }

    // Видаляємо всі Passkey користувача
    await pool.query('DELETE FROM passkey WHERE user_id = $1', [userId]);

    revalidatePath('/mx-admin/users');

    return { success: true };
  } catch (error) {
    console.error('[Action] Помилка відключення Passkey:', error);
    return { success: false, error: 'Не вдалося відключити Passkey' };
  }
};
