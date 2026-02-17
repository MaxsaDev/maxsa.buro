'use server';

import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { pool } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Екшен для видалення всіх сесій користувача
 * Доступно тільки для адміністраторів
 * Захист: не можна видалити всі сесії адміністратора (залишається хоча б одна)
 */
export const deleteUserSessions = async (
  userId: string
): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
  try {
    // Перевірка авторизації та прав адміністратора
    const currentUser = (await getCurrentUser()) as ExtendedUser | null;

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Недостатньо прав для виконання цієї дії' };
    }

    // Перевіряємо, чи існує користувач та його роль
    const userResult = await pool.query('SELECT role FROM "user" WHERE id = $1', [userId]);

    if (userResult.rowCount === 0) {
      return { success: false, error: 'Користувача не знайдено' };
    }

    const targetUserRole = userResult.rows[0].role;

    // Якщо це адміністратор - залишаємо хоча б одну сесію (захист від блокування)
    if (targetUserRole === 'admin') {
      // Отримуємо кількість сесій користувача
      const sessionsCountResult = await pool.query(
        'SELECT COUNT(*) as count FROM session WHERE "userId" = $1',
        [userId]
      );
      const sessionsCount = parseInt(sessionsCountResult.rows[0].count, 10);

      if (sessionsCount <= 1) {
        return {
          success: false,
          error: 'Неможливо видалити останню сесію адміністратора',
        };
      }

      // Видаляємо всі сесії крім найновішої
      const deleteResult = await pool.query(
        `DELETE FROM session
         WHERE "userId" = $1
         AND id NOT IN (
           SELECT id FROM session
           WHERE "userId" = $1
           ORDER BY "createdAt" DESC
           LIMIT 1
         )`,
        [userId]
      );

      revalidatePath('/mx-admin/sessions');

      return {
        success: true,
        deletedCount: deleteResult.rowCount || 0,
      };
    }

    // Для звичайних користувачів видаляємо всі сесії
    const deleteResult = await pool.query('DELETE FROM session WHERE "userId" = $1', [userId]);

    revalidatePath('/mx-admin/sessions');

    return {
      success: true,
      deletedCount: deleteResult.rowCount || 0,
    };
  } catch (error) {
    console.error('[Action] Помилка видалення сесій користувача:', error);
    return { success: false, error: 'Не вдалося видалити сесії користувача' };
  }
};
