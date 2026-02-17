import { pool } from '@/lib/db';

/**
 * Перевірити чи користувач завершив онбординг
 * Онбординг вважається завершеним, якщо є:
 * 1. Запис в mx_data.user_data (повне імʼя)
 * 2. Хоча б один контакт в mx_data.user_contact
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  try {
    const result = await pool.query<{ is_complete: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM mx_data.user_data ud
        WHERE ud.user_id = $1
        AND EXISTS (
          SELECT 1 FROM mx_data.user_contact uc
          WHERE uc.user_id = $1
        )
      ) AS is_complete`,
      [userId]
    );

    return result.rows[0]?.is_complete ?? false;
  } catch (error) {
    console.error('[isOnboardingComplete] Помилка перевірки статусу онбордингу:', error);
    // У разі помилки - не блокуємо користувача
    return true;
  }
}
