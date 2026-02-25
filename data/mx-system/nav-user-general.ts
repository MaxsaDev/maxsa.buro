import {
  NavUserGeneral,
  NavUserGeneralAdminView,
  NavUserGeneralUserView,
} from '@/interfaces/mx-system/nav-user-general';
import { pool } from '@/lib/db';

/**
 * Отримати всі призначення пунктів загального меню для конкретного користувача
 */
export async function getNavUserGeneralByUserId(userId: string): Promise<NavUserGeneral[]> {
  const client = await pool.connect();
  try {
    const sql = `SELECT * FROM mx_system.nav_user_general WHERE user_id = $1;`;
    const result = await client.query<NavUserGeneral>(sql, [userId]);
    return result.rows;
  } catch (error) {
    console.error(
      '[getNavUserGeneralByUserId] Помилка отримання загального меню користувача:',
      error
    );
    throw new Error('Не вдалося отримати загальне меню користувача');
  } finally {
    client.release();
  }
}

/**
 * Отримати 2D-матрицю пунктів загального меню для адміністратора (user × items)
 * Фільтрує за user_id
 */
export async function getNavUserGeneralAdminViewByUserId(
  userId: string
): Promise<NavUserGeneralAdminView[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM mx_system.nav_user_general_admin_view
      WHERE user_id = $1
      ORDER BY menu_sort_order, menu_id, item_sort_order, item_id;
    `;
    const result = await client.query<NavUserGeneralAdminView>(sql, [userId]);
    return result.rows;
  } catch (error) {
    console.error('[getNavUserGeneralAdminViewByUserId] Помилка:', error);
    throw new Error('Не вдалося отримати загальне меню для адміністратора');
  } finally {
    client.release();
  }
}

/**
 * Додати дозвіл на пункт загального меню для користувача
 */
export async function insertNavUserGeneral(
  userId: string,
  menuId: number,
  createdBy: string
): Promise<NavUserGeneral> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      INSERT INTO mx_system.nav_user_general (user_id, menu_id, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await client.query<NavUserGeneral>(sql, [userId, menuId, createdBy]);
    if (!result.rows[0]) throw new Error('Не вдалося додати пункт загального меню');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[insertNavUserGeneral] Помилка:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Видалити дозвіл на пункт загального меню для користувача
 */
export async function deleteNavUserGeneral(userId: string, menuId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      DELETE FROM mx_system.nav_user_general
      WHERE user_id = $1 AND menu_id = $2
    `;
    await client.query(sql, [userId, menuId]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteNavUserGeneral] Помилка:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Отримати загальне меню користувача для сайдбару
 * VIEW не фільтрує за офісом — пункти відображаються завжди
 */
export async function getNavUserGeneralUserViewByUserId(
  userId: string
): Promise<NavUserGeneralUserView[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM mx_system.nav_user_general_user_view
      WHERE user_id = $1
      ORDER BY menu_sort_order, menu_id, item_sort_order, item_id;
    `;
    const result = await client.query<NavUserGeneralUserView>(sql, [userId]);
    return result.rows;
  } catch (error) {
    console.error('[getNavUserGeneralUserViewByUserId] Помилка отримання загального меню:', error);
    throw new Error('Не вдалося отримати загальне меню користувача');
  } finally {
    client.release();
  }
}
