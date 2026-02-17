'use server';

import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { pool } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Екшен для видалення сесії
 * Доступно тільки для адміністраторів
 */
export const deleteSession = async (
  sessionId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Перевірка авторизації та прав адміністратора
    const currentUser = (await getCurrentUser()) as ExtendedUser | null;

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Недостатньо прав для виконання цієї дії' };
    }

    // Перевіряємо, чи існує сесія
    const sessionResult = await pool.query('SELECT id FROM session WHERE id = $1', [sessionId]);

    if (sessionResult.rowCount === 0) {
      return { success: false, error: 'Сесію не знайдено' };
    }

    // Видаляємо сесію
    await pool.query('DELETE FROM session WHERE id = $1', [sessionId]);

    revalidatePath('/mx-admin/sessions');

    return { success: true };
  } catch (error) {
    console.error('[Action] Помилка видалення сесії:', error);
    return { success: false, error: 'Не вдалося видалити сесію' };
  }
};
