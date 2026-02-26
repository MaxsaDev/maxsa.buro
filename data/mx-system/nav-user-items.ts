import {
  NavUserItems,
  NavUserItemsAdminView,
  NavUserItemsUserView,
} from '@/interfaces/mx-system/nav-user-items';
import { pool } from '@/lib/db';

/**
 * Отримати всі призначення пунктів меню для конкретного користувача
 */
export async function getNavUserItemsByUserId(userId: string): Promise<NavUserItems[]> {
  const client = await pool.connect();
  try {
    const sql = `SELECT * FROM mx_system.nav_user_items WHERE user_id = $1;`;
    const result = await client.query<NavUserItems>(sql, [userId]);
    return result.rows;
  } catch (error) {
    console.error('[getNavUserItemsByUserId] Помилка отримання меню користувача:', error);
    throw new Error('Не вдалося отримати меню користувача');
  } finally {
    client.release();
  }
}

/**
 * Отримати 3D-матрицю пунктів меню для адміністратора (user × offices × items)
 * Фільтрує за user_id та списком office_id
 */
export async function getNavUserItemsAdminViewByUserAndOffices(
  userId: string,
  officeIds: number[]
): Promise<NavUserItemsAdminView[]> {
  const client = await pool.connect();
  try {
    const officeParams = officeIds.map((_, i) => `$${i + 2}`).join(', ');
    const sql = `
      SELECT *
      FROM mx_system.nav_user_items_admin_view
      WHERE user_id = $1
        AND office_id IN (${officeParams})
      ORDER BY office_id, item_sort_order, item_id;
    `;
    const result = await client.query<NavUserItemsAdminView>(sql, [userId, ...officeIds]);
    return result.rows;
  } catch (error) {
    console.error('[getNavUserItemsAdminViewByUserAndOffices] Помилка:', error);
    throw new Error('Не вдалося отримати меню користувача для адміністратора');
  } finally {
    client.release();
  }
}

/**
 * Додати дозвіл на пункт меню для користувача в конкретному офісі
 */
export async function insertNavUserItemsByUserAndOffice(
  userId: string,
  menuId: number,
  officeId: number,
  createdBy: string
): Promise<NavUserItems> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      INSERT INTO mx_system.nav_user_items (user_id, menu_id, office_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await client.query<NavUserItems>(sql, [userId, menuId, officeId, createdBy]);
    if (!result.rows[0]) throw new Error('Не вдалося додати меню користувача');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[insertNavUserItemsByUserAndOffice] Помилка:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Видалити дозвіл на пункт меню для користувача в конкретному офісі
 */
export async function deleteNavUserItemsByUserAndOffice(
  userId: string,
  menuId: number,
  officeId: number
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      DELETE FROM mx_system.nav_user_items
      WHERE user_id = $1 AND menu_id = $2 AND office_id = $3
    `;
    await client.query(sql, [userId, menuId, officeId]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteNavUserItemsByUserAndOffice] Помилка:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Bulk insert: одночасно додати дозвіл на N пунктів меню для M офісів
 * Використовує INSERT ... ON CONFLICT DO NOTHING для ідемпотентності
 */
export async function bulkInsertNavUserItems(
  userId: string,
  menuIds: number[],
  officeIds: number[],
  createdBy: string
): Promise<void> {
  if (menuIds.length === 0 || officeIds.length === 0) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const valueTuples: string[] = [];
    const params: (string | number)[] = [userId, createdBy];
    let paramIdx = 3;
    for (const menuId of menuIds) {
      for (const officeId of officeIds) {
        valueTuples.push(`($1, $${paramIdx}, $${paramIdx + 1}, $2)`);
        params.push(menuId, officeId);
        paramIdx += 2;
      }
    }
    const sql = `
      INSERT INTO mx_system.nav_user_items (user_id, menu_id, office_id, created_by)
      VALUES ${valueTuples.join(', ')}
      ON CONFLICT (user_id, menu_id, office_id) DO NOTHING
    `;
    await client.query(sql, params);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[bulkInsertNavUserItems] Помилка:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Bulk delete: видалити дозволи на N пунктів меню для M офісів
 */
export async function bulkDeleteNavUserItems(
  userId: string,
  menuIds: number[],
  officeIds: number[]
): Promise<void> {
  if (menuIds.length === 0 || officeIds.length === 0) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const menuParams = menuIds.map((_, i) => `$${i + 2}`).join(', ');
    const officeParams = officeIds.map((_, i) => `$${menuIds.length + i + 2}`).join(', ');
    const sql = `
      DELETE FROM mx_system.nav_user_items
      WHERE user_id = $1
        AND menu_id IN (${menuParams})
        AND office_id IN (${officeParams})
    `;
    await client.query(sql, [userId, ...menuIds, ...officeIds]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[bulkDeleteNavUserItems] Помилка:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Отримати меню користувача з пунктами для сайдбару
 * VIEW автоматично фільтрує за офісом is_default
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
      ORDER BY menu_sort_order, menu_id, item_sort_order, item_id;
    `;
    const result = await client.query<NavUserItemsUserView>(sql, [userId]);
    return result.rows;
  } catch (error) {
    console.error('[getNavUserItemsUserViewByUserId] Помилка отримання меню:', error);
    throw new Error('Не вдалося отримати меню користувача');
  } finally {
    client.release();
  }
}
