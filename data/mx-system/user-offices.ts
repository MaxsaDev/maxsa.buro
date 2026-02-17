import type { UserOffice, UserOfficeAdminView } from '@/interfaces/mx-system/user-offices';
import { pool } from '@/lib/db';

/**
 * Отримати повну матрицю офісів для адміністратора
 * Використовує VIEW: mx_system.user_offices_admin_view
 */
export async function getUserOfficesAdminViewByUserId(
  userId: string
): Promise<UserOfficeAdminView[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM mx_system.user_offices_admin_view
      WHERE user_id = $1
      ORDER BY office_sort_order, office_id;
    `;
    const result = await client.query<UserOfficeAdminView>(sql, [userId]);
    return result.rows;
  } catch (error) {
    console.error(
      '[getUserOfficesAdminView] Помилка отримання офісів користувача для адміністратора:',
      error
    );
    throw new Error('Не вдалося отримати офіси користувача для адміністратора');
  } finally {
    client.release();
  }
}

/**
 * Призначити офіс користувачу
 */
export async function insertUserOffice(
  userId: string,
  officeId: number,
  createdBy: string
): Promise<UserOffice> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql =
      'INSERT INTO mx_system.user_offices (user_id, office_id, created_by) VALUES ($1, $2, $3) RETURNING *';
    const result = await client.query<UserOffice>(sql, [userId, officeId, createdBy]);
    if (!result.rows[0]) {
      throw new Error('Не вдалося призначити офіс користувачу');
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[insertUserOffice] Помилка призначення офісу користувачу:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Встановити офіс за замовчуванням для користувача
 * Тригер в БД автоматично скине is_default у всіх інших офісів
 */
export async function updateUserOfficeDefault(userId: string, officeId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql =
      'UPDATE mx_system.user_offices SET is_default = TRUE WHERE user_id = $1 AND office_id = $2';
    const result = await client.query(sql, [userId, officeId]);
    if (result.rowCount === 0) {
      throw new Error('Офіс не знайдено серед призначених для цього користувача');
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[updateUserOfficeDefault] Помилка встановлення офісу за замовчуванням:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Відкликати офіс у користувача
 */
export async function deleteUserOffice(userId: string, officeId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql =
      'DELETE FROM mx_system.user_offices WHERE user_id = $1 AND office_id = $2 RETURNING *';
    await client.query(sql, [userId, officeId]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteUserOffice] Помилка відкликання офісу у користувача:', error);
    throw error;
  } finally {
    client.release();
  }
}
