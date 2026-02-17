'use server';

import { pool } from '@/lib/db';

import type {
  UserPermissionsCategory,
  UserPermissionsItem,
} from '@/interfaces/mx-dic/user-permissions';

/**
 * Отримати всі категорії повноважень користувача
 */
export async function getUserPermissionsCategories(): Promise<UserPermissionsCategory[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT
        id,
        title,
        description,
        icon,
        is_active
      FROM mx_dic.user_permissions_category
      ORDER BY id ASC
    `;
    const result = await client.query<UserPermissionsCategory>(sql);
    return result.rows;
  } catch (error) {
    console.error('[getUserPermissionsCategories] Помилка отримання категорій повноважень:', error);
    throw new Error('Не вдалося отримати категорії повноважень користувача');
  } finally {
    client.release();
  }
}

/**
 * Отримати всі пункти повноважень користувача
 */
export async function getUserPermissionsItems(): Promise<UserPermissionsItem[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT
        id,
        category_id,
        title,
        description,
        sort_order,
        is_active
      FROM mx_dic.user_permissions_items
      ORDER BY category_id, sort_order ASC
    `;
    const result = await client.query<UserPermissionsItem>(sql);
    return result.rows;
  } catch (error) {
    console.error('[getUserPermissionsItems] Помилка отримання пунктів повноважень:', error);
    throw new Error('Не вдалося отримати пункти повноважень користувача');
  } finally {
    client.release();
  }
}

/**
 * Отримати пункти повноважень за категорією
 */
export async function getUserPermissionsItemsByCategoryId(
  categoryId: number
): Promise<UserPermissionsItem[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT
        id,
        category_id,
        title,
        description,
        sort_order,
        is_active
      FROM mx_dic.user_permissions_items
      WHERE category_id = $1
      ORDER BY sort_order ASC
    `;
    const result = await client.query<UserPermissionsItem>(sql, [categoryId]);
    return result.rows;
  } catch (error) {
    console.error(
      '[getUserPermissionsItemsByCategoryId] Помилка отримання пунктів повноважень:',
      error
    );
    throw new Error('Не вдалося отримати пункти повноважень за категорією');
  } finally {
    client.release();
  }
}

/**
 * Створити нову категорію повноважень
 */
export async function createUserPermissionsCategory(
  title: string,
  description: string | null,
  icon: string
): Promise<UserPermissionsCategory> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      INSERT INTO mx_dic.user_permissions_category (title, description, icon, is_active)
      VALUES ($1, $2, $3, TRUE)
      RETURNING id, title, description, icon, is_active
    `;
    const result = await client.query<UserPermissionsCategory>(sql, [title, description, icon]);
    if (result.rows.length === 0) {
      throw new Error('Не вдалося створити категорію повноважень');
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      '[createUserPermissionsCategory] Помилка створення категорії повноважень:',
      error
    );
    throw new Error('Не вдалося створити категорію повноважень користувача');
  } finally {
    client.release();
  }
}

/**
 * Оновити категорію повноважень
 */
export async function updateUserPermissionsCategory(
  id: number,
  title: string,
  description: string | null,
  icon: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      UPDATE mx_dic.user_permissions_category
      SET title = $1, description = $2, icon = $3
      WHERE id = $4
    `;
    await client.query(sql, [title, description, icon, id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      '[updateUserPermissionsCategory] Помилка оновлення категорії повноважень:',
      error
    );
    throw new Error('Не вдалося оновити категорію повноважень користувача');
  } finally {
    client.release();
  }
}

/**
 * Видалити категорію повноважень
 */
export async function deleteUserPermissionsCategory(id: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      DELETE FROM mx_dic.user_permissions_category
      WHERE id = $1
    `;
    await client.query(sql, [id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      '[deleteUserPermissionsCategory] Помилка видалення категорії повноважень:',
      error
    );
    throw new Error('Не вдалося видалити категорію повноважень користувача');
  } finally {
    client.release();
  }
}

/**
 * Створити новий пункт повноваження
 */
export async function createUserPermissionsItem(
  categoryId: number,
  title: string,
  description: string | null
): Promise<UserPermissionsItem> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Отримуємо максимальний sort_order для цієї категорії
    const maxOrderResult = await client.query<{ max_order: number }>(
      `
      SELECT COALESCE(MAX(sort_order), 0) as max_order
      FROM mx_dic.user_permissions_items
      WHERE category_id = $1
    `,
      [categoryId]
    );
    const nextSortOrder = (maxOrderResult.rows[0]?.max_order || 0) + 100;

    const sql = `
      INSERT INTO mx_dic.user_permissions_items (category_id, title, description, sort_order, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, category_id, title, description, sort_order, is_active
    `;
    const result = await client.query<UserPermissionsItem>(sql, [
      categoryId,
      title,
      description,
      nextSortOrder,
    ]);
    if (result.rows.length === 0) {
      throw new Error('Не вдалося створити пункт повноваження');
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[createUserPermissionsItem] Помилка створення пункту повноваження:', error);
    throw new Error('Не вдалося створити пункт повноваження користувача');
  } finally {
    client.release();
  }
}

/**
 * Оновити пункт повноваження
 */
export async function updateUserPermissionsItem(
  id: number,
  title: string,
  description: string | null
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      UPDATE mx_dic.user_permissions_items
      SET title = $1, description = $2
      WHERE id = $3
    `;
    await client.query(sql, [title, description, id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[updateUserPermissionsItem] Помилка оновлення пункту повноваження:', error);
    throw new Error('Не вдалося оновити пункт повноваження користувача');
  } finally {
    client.release();
  }
}

/**
 * Змінити порядок сортування пункту повноваження
 */
export async function reorderUserPermissionsItem(id: number, newSortOrder: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      UPDATE mx_dic.user_permissions_items
      SET sort_order = $1
      WHERE id = $2
    `;
    await client.query(sql, [newSortOrder, id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[reorderUserPermissionsItem] Помилка зміни порядку сортування:', error);
    throw new Error('Не вдалося змінити порядок сортування пункту повноваження');
  } finally {
    client.release();
  }
}

/**
 * Видалити пункт повноваження
 */
export async function deleteUserPermissionsItem(id: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      DELETE FROM mx_dic.user_permissions_items
      WHERE id = $1
    `;
    await client.query(sql, [id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteUserPermissionsItem] Помилка видалення пункту повноваження:', error);
    throw new Error('Не вдалося видалити пункт повноваження користувача');
  } finally {
    client.release();
  }
}

/**
 * Оновити значення is_active для категорії повноважень
 */
export async function toggleUserPermissionsCategoryActive(
  id: number,
  isActive: boolean
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      UPDATE mx_dic.user_permissions_category
      SET is_active = $1
      WHERE id = $2
    `;
    await client.query(sql, [isActive, id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      '[toggleUserPermissionsCategoryActive] Помилка оновлення активності категорії повноважень:',
      error
    );
    throw new Error('Не вдалося оновити активність категорії повноважень користувача');
  } finally {
    client.release();
  }
}

/**
 * Оновити значення is_active для пункту повноваження
 */
export async function toggleUserPermissionsItemActive(
  id: number,
  isActive: boolean
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      UPDATE mx_dic.user_permissions_items
      SET is_active = $1
      WHERE id = $2
    `;
    await client.query(sql, [isActive, id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      '[toggleUserPermissionsItemActive] Помилка оновлення активності пункту повноваження:',
      error
    );
    throw new Error('Не вдалося оновити активність пункту повноваження користувача');
  } finally {
    client.release();
  }
}
