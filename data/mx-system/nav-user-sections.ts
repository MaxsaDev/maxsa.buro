import {
  NavUserSections,
  NavUserSectionsAdminView,
  NavUserSectionsUserView,
} from '@/interfaces/mx-system/nav-user-sections';
import { pool } from '@/lib/db';

export async function getNavUserSectionsByUserId(userId: string): Promise<NavUserSections[]> {
  const client = await pool.connect();
  try {
    const sql = `SELECT * FROM mx_system.nav_user_sections WHERE user_id = $1;`;
    const params = [userId];
    const result = await client.query<NavUserSections>(sql, params);

    return result.rows;
  } catch (error) {
    console.error('[getNavUserSections] Помилка отримання меню користувача:', error);
    throw new Error('Не вдалося отримати меню користувача');
  } finally {
    client.release();
  }
}

/**
 * Отримати повну матрицю меню з секціями для адміністратора
 * Використовує VIEW: mx_system.nav_user_sections_admin_view
 */
export async function getNavUserSectionsAdminViewByUserId(
  userId: string
): Promise<NavUserSectionsAdminView[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM mx_system.nav_user_sections_admin_view
      WHERE user_id = $1
      ORDER BY category_id, item_sort_order, item_id;
    `;
    const params = [userId];
    const result = await client.query<NavUserSectionsAdminView>(sql, params);

    return result.rows;
  } catch (error) {
    console.error(
      '[getNavUserSectionsAdminView] Помилка отримання меню користувача для адміністратора:',
      error
    );
    throw new Error('Не вдалося отримати меню користувача для адміністратора');
  } finally {
    client.release();
  }
}

export async function insertNavUserSectionsByUserId(
  userId: string,
  menuId: number,
  createdBy: string
): Promise<NavUserSections> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql =
      'INSERT INTO mx_system.nav_user_sections (user_id, menu_id, created_by) VALUES ($1, $2, $3) RETURNING *';
    const params = [userId, menuId, createdBy];

    const result = await client.query<NavUserSections>(sql, params);
    if (!result.rows[0]) {
      throw new Error('Не вдалося додати меню користувача');
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[insertNavUserSections] Помилка додавання меню користувача:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteNavUserSections(userId: string, menuId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql =
      'DELETE FROM mx_system.nav_user_sections WHERE user_id = $1 AND menu_id = $2 RETURNING *';
    const params = [userId, menuId];

    await client.query(sql, params);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteNavUserSections] Помилка видалення меню користувача:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Отримати меню користувача з секціями для sidebar
 * Використовує VIEW: mx_system.nav_user_sections_user_view
 */
export async function getNavUserSectionsUserViewByUserId(
  userId: string
): Promise<NavUserSectionsUserView[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM mx_system.nav_user_sections_user_view
      WHERE user_id = $1
      ORDER BY category_id, item_sort_order, item_id;
    `;
    const params = [userId];
    const result = await client.query<NavUserSectionsUserView>(sql, params);

    return result.rows;
  } catch (error) {
    console.error('[getNavUserSectionsUserView] Помилка отримання меню користувача:', error);
    throw new Error('Не вдалося отримати меню користувача');
  } finally {
    client.release();
  }
}
