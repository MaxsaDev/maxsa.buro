import { MenuUserItems } from '@/interfaces/mx-dic/menu-user-items';
import {
  NavUserItems,
  NavUserItemsAdminView,
  NavUserItemsUserView,
} from '@/interfaces/mx-system/nav-user-items';
import { pool } from '@/lib/db';

export async function getNavUserItemsByUserId(userId: string): Promise<MenuUserItems[]> {
  const client = await pool.connect();
  try {
    const sql = `SELECT * FROM mx_system.nav_user_items WHERE user_id = $1;`;
    const params = [userId];
    const result = await client.query<MenuUserItems>(sql, params);

    return result.rows;
  } catch (error) {
    console.error('[getNavUserItems] Помилка отримання меню користувача:', error);
    throw new Error('Не вдалося отримати меню адміністратора');
  } finally {
    client.release();
  }
}

/**
 * Отримати повну матрицю меню з пунктами для адміністратора
 * Використовує VIEW: mx_system.nav_user_items_admin_view
 */
export async function getNavUserItemsAdminViewByUserId(
  userId: string
): Promise<NavUserItemsAdminView[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM mx_system.nav_user_items_admin_view
      WHERE user_id = $1
      ORDER BY item_sort_order, item_id;
    `;
    const params = [userId];
    const result = await client.query<NavUserItemsAdminView>(sql, params);

    return result.rows;
  } catch (error) {
    console.error(
      '[getNavUserItemsAdminView] Помилка отримання меню користувача для адміністратора:',
      error
    );
    throw new Error('Не вдалося отримати меню користувача для адміністратора');
  } finally {
    client.release();
  }
}

export async function insertNavUserItemsByUserId(
  userId: string,
  menuId: number,
  createdBy: string
): Promise<NavUserItems> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql =
      'INSERT INTO mx_system.nav_user_items (user_id, menu_id, created_by) VALUES ($1, $2, $3) RETURNING *';
    const params = [userId, menuId, createdBy];

    const result = await client.query<NavUserItems>(sql, params);
    if (!result.rows[0]) {
      throw new Error('Не вдалося додати меню користувача');
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[insertNavUserItems] Помилка додавання меню користувача:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteNavUserItemsByUserId(userId: string, menuId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql =
      'DELETE FROM mx_system.nav_user_items WHERE user_id = $1 AND menu_id = $2 RETURNING *';
    const params = [userId, menuId];

    await client.query(sql, params);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteNavUserItems] Помилка видалення меню користувача:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Отримати меню користувача з пунктами для sidebar
 * Використовує VIEW: mx_system.nav_user_items_user_view
 */
export async function getNavUserItemsUserViewByUserId(
  userId: string
): Promise<NavUserItemsUserView[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM mx_system.nav_user_items_user_view
      WHERE user_id = $1
      ORDER BY item_sort_order, item_id;
    `;
    const params = [userId];
    const result = await client.query<NavUserItemsUserView>(sql, params);

    return result.rows;
  } catch (error) {
    console.error('[getNavUserItemsUserView] Помилка отримання меню користувача:', error);
    throw new Error('Не вдалося отримати меню користувача');
  } finally {
    client.release();
  }
}
