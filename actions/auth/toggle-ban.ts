'use server';

import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { pool } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Екшен для бану/розбану користувача
 * Доступно тільки для адміністраторів
 */
export const toggleBan = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Перевірка авторизації та прав адміністратора
    const currentUser = (await getCurrentUser()) as ExtendedUser | null;

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Недостатньо прав для виконання цієї дії' };
    }

    // Заборонено банити самого себе
    if (currentUser.id === userId) {
      return { success: false, error: 'Ви не можете забанити самого себе' };
    }

    // Отримуємо поточний статус бану користувача
    const userResult = await pool.query('SELECT "isBanned" FROM "user" WHERE id = $1', [userId]);

    if (userResult.rowCount === 0) {
      return { success: false, error: 'Користувача не знайдено' };
    }

    const currentBanStatus = userResult.rows[0].isBanned;
    const newBanStatus = !currentBanStatus;

    // Оновлюємо статус бану
    await pool.query('UPDATE "user" SET "isBanned" = $1 WHERE id = $2', [newBanStatus, userId]);

    revalidatePath('/mx-admin/users');

    return { success: true };
  } catch (error) {
    console.error('[Action] Помилка зміни статусу бану:', error);
    return { success: false, error: 'Не вдалося змінити статус бану користувача' };
  }
};
