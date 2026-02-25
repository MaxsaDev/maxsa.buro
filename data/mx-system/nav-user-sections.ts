import {
  NavUserSections,
  NavUserSectionsAdminView,
  NavUserSectionsUserView,
} from '@/interfaces/mx-system/nav-user-sections';
import { pool } from '@/lib/db';

/**
 * Отримати всі призначення меню з секціями для конкретного користувача
 */
export async function getNavUserSectionsByUserId(userId: string): Promise<NavUserSections[]> {
  const client = await pool.connect();
  try {
    const sql = `SELECT * FROM mx_system.nav_user_sections WHERE user_id = $1;`;
    const result = await client.query<NavUserSections>(sql, [userId]);
    return result.rows;
  } catch (error) {
    console.error('[getNavUserSectionsByUserId] Помилка отримання меню користувача:', error);
    throw new Error('Не вдалося отримати меню користувача');
  } finally {
    client.release();
  }
}

/**
 * Отримати 3D-матрицю меню з секціями для адміністратора (user × offices × menu_items)
 * Фільтрує за user_id та списком office_id
 */
export async function getNavUserSectionsAdminViewByUserAndOffices(
  userId: string,
  officeIds: number[]
): Promise<NavUserSectionsAdminView[]> {
  const client = await pool.connect();
  try {
    const officeParams = officeIds.map((_, i) => `$${i + 2}`).join(', ');
    const sql = `
      SELECT *
      FROM mx_system.nav_user_sections_admin_view
      WHERE user_id = $1
        AND office_id IN (${officeParams})
      ORDER BY office_id, category_id, item_sort_order, item_id;
    `;
    const result = await client.query<NavUserSectionsAdminView>(sql, [userId, ...officeIds]);
    return result.rows;
  } catch (error) {
    console.error('[getNavUserSectionsAdminViewByUserAndOffices] Помилка:', error);
    throw new Error('Не вдалося отримати меню користувача для адміністратора');
  } finally {
    client.release();
  }
}

/**
 * Додати дозвіл на пункт меню для користувача в конкретному офісі
 */
export async function insertNavUserSectionsByUserAndOffice(
  userId: string,
  menuId: number,
  officeId: number,
  createdBy: string
): Promise<NavUserSections> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      INSERT INTO mx_system.nav_user_sections (user_id, menu_id, office_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await client.query<NavUserSections>(sql, [userId, menuId, officeId, createdBy]);
    if (!result.rows[0]) throw new Error('Не вдалося додати меню користувача');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[insertNavUserSectionsByUserAndOffice] Помилка:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Видалити дозвіл на пункт меню для користувача в конкретному офісі
 */
export async function deleteNavUserSectionsByUserAndOffice(
  userId: string,
  menuId: number,
  officeId: number
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      DELETE FROM mx_system.nav_user_sections
      WHERE user_id = $1 AND menu_id = $2 AND office_id = $3
    `;
    await client.query(sql, [userId, menuId, officeId]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteNavUserSectionsByUserAndOffice] Помилка:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Bulk insert: одночасно додати дозвіл на N пунктів меню для M офісів
 * Використовує INSERT ... ON CONFLICT DO NOTHING для ідемпотентності
 */
export async function bulkInsertNavUserSections(
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
      INSERT INTO mx_system.nav_user_sections (user_id, menu_id, office_id, created_by)
      VALUES ${valueTuples.join(', ')}
      ON CONFLICT (user_id, menu_id, office_id) DO NOTHING
    `;
    await client.query(sql, params);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[bulkInsertNavUserSections] Помилка:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Bulk delete: видалити дозволи на N пунктів меню для M офісів
 */
export async function bulkDeleteNavUserSections(
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
      DELETE FROM mx_system.nav_user_sections
      WHERE user_id = $1
        AND menu_id IN (${menuParams})
        AND office_id IN (${officeParams})
    `;
    await client.query(sql, [userId, ...menuIds, ...officeIds]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[bulkDeleteNavUserSections] Помилка:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Отримати меню користувача з секціями для сайдбару
 * VIEW автоматично фільтрує за офісом is_default
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
    const result = await client.query<NavUserSectionsUserView>(sql, [userId]);
    return result.rows;
  } catch (error) {
    console.error('[getNavUserSectionsUserViewByUserId] Помилка отримання меню:', error);
    throw new Error('Не вдалося отримати меню користувача');
  } finally {
    client.release();
  }
}
