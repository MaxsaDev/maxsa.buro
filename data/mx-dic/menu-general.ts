'use server';

import { pool } from '@/lib/db';

import type { MenuGeneralItems } from '@/interfaces/mx-dic/menu-general-items';

/**
 * Отримати всі пункти загального меню за ідентифікатором меню
 */
export async function getMenuGeneralItemsByMenuId(menuId: number): Promise<MenuGeneralItems[]> {
  try {
    const sql = `
      SELECT
        id,
        menu_id,
        title,
        icon,
        url,
        sort_order,
        is_active,
        is_default
      FROM mx_dic.menu_general_items
      WHERE menu_id = $1
      ORDER BY sort_order ASC
    `;
    const result = await pool.query<MenuGeneralItems>(sql, [menuId]);
    return result.rows;
  } catch (error) {
    console.error(
      '[getMenuGeneralItemsByMenuId] Помилка отримання пунктів загального меню:',
      error
    );
    throw new Error('Не вдалося отримати пункти загального меню');
  }
}

/**
 * Отримати всі пункти загального меню (всі меню)
 */
export async function getAllMenuGeneralItems(): Promise<MenuGeneralItems[]> {
  try {
    const sql = `
      SELECT
        id,
        menu_id,
        title,
        icon,
        url,
        sort_order,
        is_active,
        is_default
      FROM mx_dic.menu_general_items
      ORDER BY menu_id, sort_order ASC
    `;
    const result = await pool.query<MenuGeneralItems>(sql);
    return result.rows;
  } catch (error) {
    console.error(
      '[getAllMenuGeneralItems] Помилка отримання всіх пунктів загального меню:',
      error
    );
    throw new Error('Не вдалося отримати пункти загального меню');
  }
}

/**
 * Створити новий пункт загального меню
 */
export async function createMenuGeneralItem(
  menuId: number,
  title: string,
  url: string,
  icon: string
): Promise<MenuGeneralItems> {
  try {
    const sql = `
      INSERT INTO mx_dic.menu_general_items (menu_id, title, url, icon)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query<MenuGeneralItems>(sql, [menuId, title, url, icon]);
    if (!result.rows[0]) throw new Error('Не вдалося створити пункт загального меню');
    return result.rows[0];
  } catch (error) {
    console.error('[createMenuGeneralItem] Помилка створення пункту загального меню:', error);
    throw error;
  }
}

/**
 * Оновити заголовок пункту загального меню
 */
export async function updateMenuGeneralItemTitle(id: number, title: string): Promise<void> {
  try {
    await pool.query('UPDATE mx_dic.menu_general_items SET title = $2 WHERE id = $1', [id, title]);
  } catch (error) {
    console.error('[updateMenuGeneralItemTitle] Помилка оновлення заголовку:', error);
    throw error;
  }
}

/**
 * Оновити URL пункту загального меню
 */
export async function updateMenuGeneralItemUrl(id: number, url: string): Promise<void> {
  try {
    await pool.query('UPDATE mx_dic.menu_general_items SET url = $2 WHERE id = $1', [id, url]);
  } catch (error) {
    console.error('[updateMenuGeneralItemUrl] Помилка оновлення URL:', error);
    throw error;
  }
}

/**
 * Оновити іконку пункту загального меню
 */
export async function updateMenuGeneralItemIcon(id: number, icon: string): Promise<void> {
  try {
    await pool.query('UPDATE mx_dic.menu_general_items SET icon = $2 WHERE id = $1', [id, icon]);
  } catch (error) {
    console.error('[updateMenuGeneralItemIcon] Помилка оновлення іконки:', error);
    throw error;
  }
}

/**
 * Змінити активність пункту загального меню
 */
export async function toggleMenuGeneralItemActive(id: number, isActive: boolean): Promise<void> {
  try {
    await pool.query('UPDATE mx_dic.menu_general_items SET is_active = $2 WHERE id = $1', [
      id,
      isActive,
    ]);
  } catch (error) {
    console.error('[toggleMenuGeneralItemActive] Помилка зміни активності:', error);
    throw error;
  }
}

/**
 * Змінити is_default пункту загального меню
 */
export async function updateMenuGeneralItemDefault(id: number, isDefault: boolean): Promise<void> {
  try {
    await pool.query('UPDATE mx_dic.menu_general_items SET is_default = $2 WHERE id = $1', [
      id,
      isDefault,
    ]);
  } catch (error) {
    console.error('[updateMenuGeneralItemDefault] Помилка зміни is_default:', error);
    throw error;
  }
}

/**
 * Видалити пункт загального меню
 */
export async function deleteMenuGeneralItem(id: number): Promise<void> {
  try {
    await pool.query('DELETE FROM mx_dic.menu_general_items WHERE id = $1', [id]);
  } catch (error) {
    console.error('[deleteMenuGeneralItem] Помилка видалення пункту загального меню:', error);
    throw error;
  }
}
