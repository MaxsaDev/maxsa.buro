import { pool } from '@/lib/db';

/**
 * Перевірити чи імʼя зайняте іншим користувачем
 */
export async function isNameTaken(name: string, excludeUserId?: string): Promise<boolean> {
  try {
    const result = await pool.query(`SELECT id FROM "user" WHERE name = $1 AND id != $2`, [
      name,
      excludeUserId || '',
    ]);

    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('[isNameTaken] Помилка перевірки імені:', error);
    throw error;
  }
}

/**
 * Оновити імʼя користувача
 */
export async function updateUserName(userId: string, newName: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(`UPDATE "user" SET name = $1 WHERE id = $2`, [
      newName,
      userId,
    ]);

    if (result.rowCount === 0) {
      throw new Error('Користувача не знайдено');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[updateUserName] Помилка оновлення імені:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Отримати користувача за ID
 */
export async function getUserById(userId: string): Promise<{ id: string; name: string } | null> {
  try {
    const result = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM "user" WHERE id = $1 LIMIT 1`,
      [userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('[getUserById] Помилка отримання користувача:', error);
    throw error;
  }
}

/**
 * Оновити аватар користувача
 */
export async function updateUserImage(userId: string, imagePath: string | null): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(`UPDATE "user" SET image = $1 WHERE id = $2`, [
      imagePath,
      userId,
    ]);

    if (result.rowCount === 0) {
      throw new Error('Користувача не знайдено');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[updateUserImage] Помилка оновлення аватара:', error);
    throw error;
  } finally {
    client.release();
  }
}
