'use server';

import { pool } from '@/lib/db';

import type { UserView } from '@/interfaces/public/user-view';

/**
 * Отримати роль користувача за ID
 */
export const getUserView = async (): Promise<UserView[]> => {
  try {
    const result = await pool.query<UserView>(
      'SELECT * FROM user_view ORDER BY role, is_banned, created_at DESC'
    );

    return result.rows;
  } catch (error) {
    console.error('[Data Auth UserView] Помилка отримання списку користувачів:', error);
    throw new Error('Не вдалося отримати список користувачів');
  }
};
