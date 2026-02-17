import {
  NavUserPermissions,
  NavUserPermissionsAdminView,
  NavUserPermissionsUserView,
} from '@/interfaces/mx-system/nav-user-permissions';
import { pool } from '@/lib/db';

export async function getNavUserPermissionsByUserId(userId: string): Promise<NavUserPermissions[]> {
  const client = await pool.connect();
  try {
    const sql = `SELECT * FROM mx_system.nav_user_permissions WHERE user_id = $1;`;
    const params = [userId];
    const result = await client.query<NavUserPermissions>(sql, params);

    return result.rows;
  } catch (error) {
    console.error('[getNavUserPermissions] Помилка отримання повноважень користувача:', error);
    throw new Error('Не вдалося отримати повноваження користувача');
  } finally {
    client.release();
  }
}

/**
 * Отримати повну матрицю повноважень з категоріями для адміністратора
 * Використовує VIEW: mx_system.nav_user_permissions_admin_view
 */
export async function getNavUserPermissionsAdminViewByUserId(
  userId: string
): Promise<NavUserPermissionsAdminView[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM mx_system.nav_user_permissions_admin_view
      WHERE user_id = $1
      ORDER BY category_id, permission_sort_order, permission_id;
    `;
    const params = [userId];
    const result = await client.query<NavUserPermissionsAdminView>(sql, params);

    return result.rows;
  } catch (error) {
    console.error(
      '[getNavUserPermissionsAdminView] Помилка отримання повноважень користувача для адміністратора:',
      error
    );
    throw new Error('Не вдалося отримати повноваження користувача для адміністратора');
  } finally {
    client.release();
  }
}

/**
 * Отримати повноваження користувача для sidebar/перевірки
 * Використовує VIEW: mx_system.nav_user_permissions_user_view
 */
export async function getNavUserPermissionsUserViewByUserId(
  userId: string
): Promise<NavUserPermissionsUserView[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM mx_system.nav_user_permissions_user_view
      WHERE user_id = $1
      ORDER BY category_id, permission_sort_order, permission_id;
    `;
    const params = [userId];
    const result = await client.query<NavUserPermissionsUserView>(sql, params);

    return result.rows;
  } catch (error) {
    console.error(
      '[getNavUserPermissionsUserView] Помилка отримання повноважень користувача:',
      error
    );
    throw new Error('Не вдалося отримати повноваження користувача');
  } finally {
    client.release();
  }
}

export async function insertNavUserPermissionsByUserId(
  userId: string,
  permissionId: number,
  createdBy: string
): Promise<NavUserPermissions> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql =
      'INSERT INTO mx_system.nav_user_permissions (user_id, permission_id, created_by) VALUES ($1, $2, $3) RETURNING *';
    const params = [userId, permissionId, createdBy];

    const result = await client.query<NavUserPermissions>(sql, params);
    if (!result.rows[0]) {
      throw new Error('Не вдалося додати повноваження користувача');
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[insertNavUserPermissions] Помилка додавання повноваження користувача:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteNavUserPermissions(
  userId: string,
  permissionId: number
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql =
      'DELETE FROM mx_system.nav_user_permissions WHERE user_id = $1 AND permission_id = $2 RETURNING *';
    const params = [userId, permissionId];

    await client.query(sql, params);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteNavUserPermissions] Помилка видалення повноваження користувача:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Перевірити чи має користувач конкретне повноваження
 */
export async function getUserPermission(userId: string, permissionId: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT EXISTS(
        SELECT 1
        FROM mx_system.nav_user_permissions nup
        JOIN mx_dic.user_permissions_items p ON p.id = nup.permission_id
        JOIN mx_dic.user_permissions_category c ON c.id = p.category_id
        WHERE nup.user_id = $1
          AND nup.permission_id = $2
          AND p.is_active = TRUE
          AND c.is_active = TRUE
      ) as has_permission;
    `;
    const params = [userId, permissionId];
    const result = await client.query<{ has_permission: boolean }>(sql, params);

    return result.rows[0]?.has_permission ?? false;
  } catch (error) {
    console.error('[getUserPermission] Помилка перевірки повноваження:', error);
    throw new Error('Не вдалося перевірити повноваження користувача');
  } finally {
    client.release();
  }
}
