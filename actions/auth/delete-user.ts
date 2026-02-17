'use server';

import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { pool } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Екшен для видалення користувача
 * Доступно тільки для адміністраторів
 * Використовується каскадне видалення на рівні БД
 */
export const deleteUser = async (
  userId: string,
  confirmationWord: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Перевірка авторизації та прав адміністратора
    const currentUser = (await getCurrentUser()) as ExtendedUser | null;

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Недостатньо прав для виконання цієї дії' };
    }

    // Заборонено видаляти самого себе
    if (currentUser.id === userId) {
      return { success: false, error: 'Ви не можете видалити самого себе' };
    }

    // Перевірка підтверджуючого слова
    if (confirmationWord !== 'DELETE') {
      return { success: false, error: 'Невірне підтверджуюче слово' };
    }

    // Отримуємо інформацію про користувача перед видаленням
    const userResult = await pool.query('SELECT name, email FROM "user" WHERE id = $1', [userId]);

    if (userResult.rowCount === 0) {
      return { success: false, error: 'Користувача не знайдено' };
    }

    // Видаляємо користувача (каскадне видалення спрацює автоматично)
    await pool.query('DELETE FROM "user" WHERE id = $1', [userId]);

    console.log(
      `[Action] Користувача видалено адміністратором: ${userResult.rows[0].email} (${userResult.rows[0].name})`
    );

    revalidatePath('/mx-admin/users');

    return { success: true };
  } catch (error) {
    console.error('[Action] Помилка видалення користувача:', error);
    return { success: false, error: 'Не вдалося видалити користувача' };
  }
};
