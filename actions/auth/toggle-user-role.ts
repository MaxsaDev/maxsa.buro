'use server';

import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { pool } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Екшен для зміни ролі користувача (user <-> admin)
 * Доступно тільки для адміністраторів
 */
export const toggleUserRole = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Перевірка авторизації та прав адміністратора
    const currentUser = (await getCurrentUser()) as ExtendedUser | null;

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Недостатньо прав для виконання цієї дії' };
    }

    // Заборонено змінювати роль самого себе
    if (currentUser.id === userId) {
      return { success: false, error: 'Ви не можете змінити власну роль' };
    }

    // Отримуємо поточну роль користувача
    const userResult = await pool.query('SELECT role FROM "user" WHERE id = $1', [userId]);

    if (userResult.rowCount === 0) {
      return { success: false, error: 'Користувача не знайдено' };
    }

    const currentRole = userResult.rows[0].role;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    // Оновлюємо роль користувача
    await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', [newRole, userId]);

    revalidatePath('/mx-admin/users');

    return { success: true };
  } catch (error) {
    console.error('[Action] Помилка зміни ролі користувача:', error);
    return { success: false, error: 'Не вдалося змінити роль користувача' };
  }
};
