'use server';

import { pool } from '@/lib/db';

import type { Menu } from '@/interfaces/mx-dic/menus';
import type { MenuType } from '@/interfaces/mx-dic/menu-types';

/**
 * Отримати всі типи меню
 */
export async function getMenuTypes(): Promise<MenuType[]> {
  try {
    const sql = `
      SELECT
        id,
        code,
        title,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM mx_dic.menu_types
      WHERE is_active = TRUE
      ORDER BY sort_order ASC
    `;
    const result = await pool.query<MenuType>(sql);
    return result.rows;
  } catch (error) {
    console.error('[getMenuTypes] Помилка отримання типів меню:', error);
    throw new Error('Не вдалося отримати типи меню');
  }
}

/**
 * Отримати всі меню за типом
 */
export async function getMenusByType(menuTypeCode: string): Promise<Menu[]> {
  try {
    const sql = `
      SELECT
        m.id,
        m.title,
        m.menu_type_id,
        m.sort_order,
        m.is_active,
        m.created_at,
        m.updated_at
      FROM mx_dic.menus m
      JOIN mx_dic.menu_types mt ON m.menu_type_id = mt.id
      WHERE mt.code = $1
      ORDER BY m.sort_order ASC
    `;
    const result = await pool.query<Menu>(sql, [menuTypeCode]);
    return result.rows;
  } catch (error) {
    console.error('[getMenusByType] Помилка отримання меню:', error);
    throw new Error('Не вдалося отримати меню');
  }
}

/**
 * Створити нове меню
 */
export async function createMenu(title: string, menuTypeId: number): Promise<Menu> {
  try {
    const sql = `
      INSERT INTO mx_dic.menus (title, menu_type_id, is_active)
      VALUES ($1, $2, TRUE)
      RETURNING id, title, menu_type_id, sort_order, is_active, created_at, updated_at
    `;
    const result = await pool.query<Menu>(sql, [title, menuTypeId]);
    if (result.rows.length === 0) {
      throw new Error('Не вдалося створити меню');
    }
    return result.rows[0];
  } catch (error) {
    console.error('[createMenu] Помилка створення меню:', error);
    throw new Error('Не вдалося створити меню');
  }
}

/**
 * Оновити назву меню
 */
export async function updateMenuTitle(id: number, title: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menus
      SET title = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [title, id]);
  } catch (error) {
    console.error('[updateMenuTitle] Помилка оновлення назви меню:', error);
    throw new Error('Не вдалося оновити назву меню');
  }
}

/**
 * Оновити активність меню
 */
export async function updateMenuActive(id: number, isActive: boolean): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menus
      SET is_active = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [isActive, id]);
  } catch (error) {
    console.error('[updateMenuActive] Помилка оновлення активності меню:', error);
    throw new Error('Не вдалося оновити активність меню');
  }
}

/**
 * Оновити порядок меню (для drag&drop)
 */
export async function updateMenuSortOrder(id: number, sortOrder: number): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menus
      SET sort_order = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [sortOrder, id]);
  } catch (error) {
    console.error('[updateMenuSortOrder] Помилка оновлення порядку меню:', error);
    throw new Error('Не вдалося оновити порядок меню');
  }
}

/**
 * Видалити меню
 */
export async function deleteMenu(id: number): Promise<void> {
  try {
    const sql = `
      DELETE FROM mx_dic.menus
      WHERE id = $1
    `;
    await pool.query(sql, [id]);
  } catch (error) {
    console.error('[deleteMenu] Помилка видалення меню:', error);
    throw new Error('Не вдалося видалити меню');
  }
}
