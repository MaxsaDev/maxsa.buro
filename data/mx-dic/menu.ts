import { pool } from '@/lib/db';
import { MenuAppSupport } from '../../interfaces/mx-dic/menu-app-support';

export async function getNavAppSupport(userId: string): Promise<MenuAppSupport[]> {
  const client = await pool.connect();
  try {
    const sql = `SELECT * FROM mx_dic.nav_app_support WHERE user_id = $1;`;
    const params = [userId];
    const result = await client.query<MenuAppSupport>(sql, params);

    return result.rows;
  } catch (error) {
    console.error(
      '[getNavAppSupport] Помилка отримання меню підтримки та зворотнього звʼязку:',
      error
    );
    throw new Error('Не вдалося отримати меню підтримки та зворотнього звʼязку');
  }
}

export async function insertNavAppSupport(userId: string, menuId: number): Promise<MenuAppSupport> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = 'INSERT INTO mx_dic.nav_app_support (user_id, menu_id) VALUES ($1, $2) RETURNING *';
    const params = [userId, menuId];

    const result = await client.query<MenuAppSupport>(sql, params);
    if (!result.rows[0]) {
      throw new Error('Не вдалося додати меню підтримки та зворотнього звʼязку');
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      '[insertNavAppSupport] Помилка додавання меню підтримки та зворотнього звʼязку:',
      error
    );
    throw error;
  } finally {
    client.release();
  }
}

//UPDATE NAV APP SUPPORT
export async function updateNavAppSupport(
  id: number,
  title: string,
  url: string,
  icon: string,
  is_active: boolean
): Promise<MenuAppSupport> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql =
      'UPDATE mx_dic.nav_app_support SET title = $1, url = $2, icon = $3, is_active = $4 WHERE id = $5 RETURNING *';
    const params = [title, url, icon, is_active, id];

    const result = await client.query<MenuAppSupport>(sql, params);
    if (!result.rows[0]) {
      throw new Error('Не вдалося оновити меню підтримки та зворотнього звʼязку');
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      '[updateNavAppSupport] Помилка оновлення меню підтримки та зворотнього звʼязку:',
      error
    );
    throw error;
  }
}

export async function deleteNavAppSupport(id: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = 'DELETE FROM mx_system.nav_app_support WHERE id = $1 RETURNING *';
    const params = [id];

    await client.query(sql, params);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      '[deleteNavAppSupport] Помилка видалення меню підтримки та зворотнього звʼязку:',
      error
    );
    throw error;
  } finally {
    client.release();
  }
}
