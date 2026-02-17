'use server';

import { pool } from '@/lib/db';

import type { MenuAppSupport } from '@/interfaces/mx-dic/menu-app-support';
import type { MenuUserItems } from '@/interfaces/mx-dic/menu-user-items';
import type {
  MenuUserSectionsCategory,
  MenuUserSectionsItems,
} from '@/interfaces/mx-dic/menu-user-sections';

/**
 * Отримати всі категорії меню користувача з секціями
 */
export async function getMenuUserSectionsCategories(): Promise<MenuUserSectionsCategory[]> {
  try {
    const sql = `
      SELECT
        id,
        menu_id,
        title,
        url,
        icon,
        is_active
      FROM mx_dic.menu_user_sections_category
      ORDER BY menu_id, id ASC
    `;
    const result = await pool.query<MenuUserSectionsCategory>(sql);
    return result.rows;
  } catch (error) {
    console.error('[getMenuUserSectionsCategories] Помилка отримання категорій меню:', error);
    throw new Error('Не вдалося отримати категорії меню користувача');
  }
}

/**
 * Отримати всі пункти меню користувача з секціями
 */
export async function getMenuUserSectionsItems(): Promise<MenuUserSectionsItems[]> {
  try {
    const sql = `
      SELECT
        id,
        category_id,
        title,
        icon,
        url,
        sort_order,
        is_active,
        is_default
      FROM mx_dic.menu_user_sections_items
      ORDER BY category_id, sort_order ASC
    `;
    const result = await pool.query<MenuUserSectionsItems>(sql);
    return result.rows;
  } catch (error) {
    console.error('[getMenuUserSectionsItems] Помилка отримання пунктів меню:', error);
    throw new Error('Не вдалося отримати пункти меню користувача');
  }
}

/**
 * Отримати всі пункти меню користувача (без секцій)
 */
export async function getMenuUserItems(): Promise<MenuUserItems[]> {
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
      FROM mx_dic.menu_user_items
      ORDER BY menu_id, sort_order ASC
    `;
    const result = await pool.query<MenuUserItems>(sql);
    return result.rows;
  } catch (error) {
    console.error('[getMenuUserItems] Помилка отримання пунктів меню:', error);
    throw new Error('Не вдалося отримати пункти меню користувача');
  }
}

/**
 * Отримати всі пункти меню підтримки приложения
 */
export async function getMenuAppSupport(): Promise<MenuAppSupport[]> {
  try {
    const sql = `
      SELECT
        id,
        menu_id,
        title,
        url,
        icon,
        is_active
      FROM mx_dic.menu_app_support
      ORDER BY menu_id, id ASC
    `;
    const result = await pool.query<MenuAppSupport>(sql);
    return result.rows;
  } catch (error) {
    console.error('[getMenuAppSupport] Помилка отримання меню підтримки:', error);
    throw new Error('Не вдалося отримати меню підтримки');
  }
}

/**
 * Оновити значення is_active для пункту меню користувача (без секцій)
 */
export async function updateMenuUserItemsActive(id: number, isActive: boolean): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_items
      SET is_active = $1
      WHERE id = $2
    `;
    await pool.query(sql, [isActive, id]);
  } catch (error) {
    console.error('[updateMenuUserItemsActive] Помилка оновлення активності пункту меню:', error);
    throw new Error('Не вдалося оновити активність пункту меню користувача');
  }
}

/**
 * Оновити значення is_active для пункту меню користувача з секціями
 */
export async function updateMenuUserSectionsItemsActive(
  id: number,
  isActive: boolean
): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_sections_items
      SET is_active = $1
      WHERE id = $2
    `;
    await pool.query(sql, [isActive, id]);
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsItemsActive] Помилка оновлення активності пункту меню:',
      error
    );
    throw new Error('Не вдалося оновити активність пункту меню користувача з секціями');
  }
}

/**
 * Оновити значення is_active для категорії меню користувача з секціями
 */
export async function updateMenuUserSectionsCategoryActive(
  id: number,
  isActive: boolean
): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_sections_category
      SET is_active = $1
      WHERE id = $2
    `;
    await pool.query(sql, [isActive, id]);
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsCategoryActive] Помилка оновлення активності категорії меню:',
      error
    );
    throw new Error('Не вдалося оновити активність категорії меню користувача');
  }
}

/**
 * Оновити значення is_active для пункту меню підтримки приложения
 */
export async function updateMenuAppSupportActive(id: number, isActive: boolean): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_app_support
      SET is_active = $1
      WHERE id = $2
    `;
    await pool.query(sql, [isActive, id]);
  } catch (error) {
    console.error('[updateMenuAppSupportActive] Помилка оновлення активності пункту меню:', error);
    throw new Error('Не вдалося оновити активність пункту меню підтримки приложения');
  }
}

/**
 * Оновити title для пункту меню користувача (без секцій)
 */
export async function updateMenuUserItemsTitle(id: number, title: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_items
      SET title = $1
      WHERE id = $2
    `;
    await pool.query(sql, [title, id]);
  } catch (error) {
    console.error('[updateMenuUserItemsTitle] Помилка оновлення назви пункту меню:', error);
    throw new Error('Не вдалося оновити назву пункту меню користувача');
  }
}

/**
 * Оновити url для пункту меню користувача (без секцій)
 */
export async function updateMenuUserItemsUrl(id: number, url: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_items
      SET url = $1
      WHERE id = $2
    `;
    await pool.query(sql, [url, id]);
  } catch (error) {
    console.error('[updateMenuUserItemsUrl] Помилка оновлення URL пункту меню:', error);
    throw new Error('Не вдалося оновити URL пункту меню користувача');
  }
}

/**
 * Оновити title для пункту меню користувача з секціями
 */
export async function updateMenuUserSectionsItemsTitle(id: number, title: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_sections_items
      SET title = $1
      WHERE id = $2
    `;
    await pool.query(sql, [title, id]);
  } catch (error) {
    console.error('[updateMenuUserSectionsItemsTitle] Помилка оновлення назви пункту меню:', error);
    throw new Error('Не вдалося оновити назву пункту меню користувача з секціями');
  }
}

/**
 * Оновити url для пункту меню користувача з секціями
 */
export async function updateMenuUserSectionsItemsUrl(id: number, url: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_sections_items
      SET url = $1
      WHERE id = $2
    `;
    await pool.query(sql, [url, id]);
  } catch (error) {
    console.error('[updateMenuUserSectionsItemsUrl] Помилка оновлення URL пункту меню:', error);
    throw new Error('Не вдалося оновити URL пункту меню користувача з секціями');
  }
}

/**
 * Оновити title для категорії меню користувача з секціями
 */
export async function updateMenuUserSectionsCategoryTitle(
  id: number,
  title: string
): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_sections_category
      SET title = $1
      WHERE id = $2
    `;
    await pool.query(sql, [title, id]);
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsCategoryTitle] Помилка оновлення назви категорії меню:',
      error
    );
    throw new Error('Не вдалося оновити назву категорії меню користувача');
  }
}

/**
 * Оновити url для категорії меню користувача з секціями
 */
export async function updateMenuUserSectionsCategoryUrl(id: number, url: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_sections_category
      SET url = $1
      WHERE id = $2
    `;
    await pool.query(sql, [url, id]);
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsCategoryUrl] Помилка оновлення URL категорії меню:',
      error
    );
    throw new Error('Не вдалося оновити URL категорії меню користувача');
  }
}

/**
 * Оновити title для пункту меню підтримки приложения
 */
export async function updateMenuAppSupportTitle(id: number, title: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_app_support
      SET title = $1
      WHERE id = $2
    `;
    await pool.query(sql, [title, id]);
  } catch (error) {
    console.error('[updateMenuAppSupportTitle] Помилка оновлення назви пункту меню:', error);
    throw new Error('Не вдалося оновити назву пункту меню підтримки приложения');
  }
}

/**
 * Оновити url для пункту меню підтримки приложения
 */
export async function updateMenuAppSupportUrl(id: number, url: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_app_support
      SET url = $1
      WHERE id = $2
    `;
    await pool.query(sql, [url, id]);
  } catch (error) {
    console.error('[updateMenuAppSupportUrl] Помилка оновлення URL пункту меню:', error);
    throw new Error('Не вдалося оновити URL пункту меню підтримки приложения');
  }
}

/**
 * Оновити icon для пункту меню користувача (без секцій)
 */
export async function updateMenuUserItemsIcon(id: number, icon: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_items
      SET icon = $1
      WHERE id = $2
    `;
    await pool.query(sql, [icon, id]);
  } catch (error) {
    console.error('[updateMenuUserItemsIcon] Помилка оновлення іконки пункту меню:', error);
    throw new Error('Не вдалося оновити іконку пункту меню користувача');
  }
}

/**
 * Оновити icon для пункту меню користувача з секціями
 */
export async function updateMenuUserSectionsItemsIcon(id: number, icon: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_sections_items
      SET icon = $1
      WHERE id = $2
    `;
    await pool.query(sql, [icon, id]);
  } catch (error) {
    console.error('[updateMenuUserSectionsItemsIcon] Помилка оновлення іконки пункту меню:', error);
    throw new Error('Не вдалося оновити іконку пункту меню користувача з секціями');
  }
}

/**
 * Оновити icon для категорії меню користувача з секціями
 */
export async function updateMenuUserSectionsCategoryIcon(id: number, icon: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_sections_category
      SET icon = $1
      WHERE id = $2
    `;
    await pool.query(sql, [icon, id]);
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsCategoryIcon] Помилка оновлення іконки категорії меню:',
      error
    );
    throw new Error('Не вдалося оновити іконку категорії меню користувача');
  }
}

/**
 * Оновити icon для пункту меню підтримки приложения
 */
export async function updateMenuAppSupportIcon(id: number, icon: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_app_support
      SET icon = $1
      WHERE id = $2
    `;
    await pool.query(sql, [icon, id]);
  } catch (error) {
    console.error('[updateMenuAppSupportIcon] Помилка оновлення іконки пункту меню:', error);
    throw new Error('Не вдалося оновити іконку пункту меню підтримки приложения');
  }
}

/**
 * Оновити значення is_default для пункту меню користувача (без секцій)
 */
export async function updateMenuUserItemsDefault(id: number, isDefault: boolean): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_items
      SET is_default = $1
      WHERE id = $2
    `;
    await pool.query(sql, [isDefault, id]);
  } catch (error) {
    console.error('[updateMenuUserItemsDefault] Помилка оновлення is_default пункту меню:', error);
    throw new Error('Не вдалося оновити is_default пункту меню користувача');
  }
}

/**
 * Оновити значення is_default для пункту меню користувача з секціями
 */
export async function updateMenuUserSectionsItemsDefault(
  id: number,
  isDefault: boolean
): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.menu_user_sections_items
      SET is_default = $1
      WHERE id = $2
    `;
    await pool.query(sql, [isDefault, id]);
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsItemsDefault] Помилка оновлення is_default пункту меню:',
      error
    );
    throw new Error('Не вдалося оновити is_default пункту меню користувача з секціями');
  }
}

/**
 * Створити нову категорію меню користувача з секціями
 */
export async function createMenuUserSectionsCategory(
  menuId: number,
  title: string,
  url: string,
  icon: string
): Promise<MenuUserSectionsCategory> {
  try {
    const sql = `
      INSERT INTO mx_dic.menu_user_sections_category (menu_id, title, url, icon, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, menu_id, title, url, icon, is_active
    `;
    const result = await pool.query<MenuUserSectionsCategory>(sql, [menuId, title, url, icon]);
    if (result.rows.length === 0) {
      throw new Error('Не вдалося створити категорію меню');
    }
    return result.rows[0];
  } catch (error) {
    console.error('[createMenuUserSectionsCategory] Помилка створення категорії меню:', error);
    throw new Error('Не вдалося створити категорію меню користувача');
  }
}

/**
 * Створити новий пункт меню користувача з секціями
 */
export async function createMenuUserSectionsItem(
  categoryId: number,
  title: string,
  url: string,
  icon: string
): Promise<MenuUserSectionsItems> {
  try {
    // Отримуємо максимальний sort_order для цієї категорії
    const maxOrderResult = await pool.query<{ max_order: number }>(
      `
      SELECT COALESCE(MAX(sort_order), 0) as max_order
      FROM mx_dic.menu_user_sections_items
      WHERE category_id = $1
    `,
      [categoryId]
    );
    const nextSortOrder = (maxOrderResult.rows[0]?.max_order || 0) + 100;

    const sql = `
      INSERT INTO mx_dic.menu_user_sections_items (category_id, title, url, icon, sort_order, is_active, is_default)
      VALUES ($1, $2, $3, $4, $5, TRUE, FALSE)
      RETURNING id, category_id, title, icon, url, sort_order, is_active, is_default
    `;
    const result = await pool.query<MenuUserSectionsItems>(sql, [
      categoryId,
      title,
      url,
      icon,
      nextSortOrder,
    ]);
    if (result.rows.length === 0) {
      throw new Error('Не вдалося створити пункт меню');
    }
    return result.rows[0];
  } catch (error) {
    console.error('[createMenuUserSectionsItem] Помилка створення пункту меню:', error);
    throw new Error('Не вдалося створити пункт меню користувача з секціями');
  }
}

/**
 * Створити новий пункт меню користувача (без секцій)
 */
export async function createMenuUserItem(
  menuId: number,
  title: string,
  url: string,
  icon: string
): Promise<MenuUserItems> {
  try {
    // Отримуємо максимальний sort_order для цього меню
    const maxOrderResult = await pool.query<{ max_order: number }>(
      `
      SELECT COALESCE(MAX(sort_order), 0) as max_order
      FROM mx_dic.menu_user_items
      WHERE menu_id = $1
    `,
      [menuId]
    );
    const nextSortOrder = (maxOrderResult.rows[0]?.max_order || 0) + 100;

    const sql = `
      INSERT INTO mx_dic.menu_user_items (menu_id, title, url, icon, sort_order, is_active, is_default)
      VALUES ($1, $2, $3, $4, $5, TRUE, FALSE)
      RETURNING id, menu_id, title, icon, url, sort_order, is_active, is_default
    `;
    const result = await pool.query<MenuUserItems>(sql, [menuId, title, url, icon, nextSortOrder]);
    if (result.rows.length === 0) {
      throw new Error('Не вдалося створити пункт меню');
    }
    return result.rows[0];
  } catch (error) {
    console.error('[createMenuUserItem] Помилка створення пункту меню:', error);
    throw new Error('Не вдалося створити пункт меню користувача');
  }
}

/**
 * Створити новий пункт меню підтримки приложения
 */
export async function createMenuAppSupport(
  menuId: number,
  title: string,
  url: string,
  icon: string
): Promise<MenuAppSupport> {
  try {
    const sql = `
      INSERT INTO mx_dic.menu_app_support (menu_id, title, url, icon, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, menu_id, title, url, icon, is_active
    `;
    const result = await pool.query<MenuAppSupport>(sql, [menuId, title, url, icon]);
    if (result.rows.length === 0) {
      throw new Error('Не вдалося створити пункт меню');
    }
    return result.rows[0];
  } catch (error) {
    console.error('[createMenuAppSupport] Помилка створення пункту меню:', error);
    throw new Error('Не вдалося створити пункт меню підтримки приложения');
  }
}

/**
 * Видалити категорію меню користувача з секціями
 */
export async function deleteMenuUserSectionsCategory(id: number): Promise<void> {
  try {
    const sql = `
      DELETE FROM mx_dic.menu_user_sections_category
      WHERE id = $1
    `;
    await pool.query(sql, [id]);
  } catch (error) {
    console.error('[deleteMenuUserSectionsCategory] Помилка видалення категорії меню:', error);
    throw new Error('Не вдалося видалити категорію меню користувача');
  }
}

/**
 * Видалити пункт меню користувача з секціями
 */
export async function deleteMenuUserSectionsItem(id: number): Promise<void> {
  try {
    const sql = `
      DELETE FROM mx_dic.menu_user_sections_items
      WHERE id = $1
    `;
    await pool.query(sql, [id]);
  } catch (error) {
    console.error('[deleteMenuUserSectionsItem] Помилка видалення пункту меню:', error);
    throw new Error('Не вдалося видалити пункт меню користувача з секціями');
  }
}

/**
 * Видалити пункт меню користувача (без секцій)
 */
export async function deleteMenuUserItem(id: number): Promise<void> {
  try {
    const sql = `
      DELETE FROM mx_dic.menu_user_items
      WHERE id = $1
    `;
    await pool.query(sql, [id]);
  } catch (error) {
    console.error('[deleteMenuUserItem] Помилка видалення пункту меню:', error);
    throw new Error('Не вдалося видалити пункт меню користувача');
  }
}

/**
 * Видалити пункт меню підтримки приложения
 */
export async function deleteMenuAppSupport(id: number): Promise<void> {
  try {
    const sql = `
      DELETE FROM mx_dic.menu_app_support
      WHERE id = $1
    `;
    await pool.query(sql, [id]);
  } catch (error) {
    console.error('[deleteMenuAppSupport] Помилка видалення пункту меню:', error);
    throw new Error('Не вдалося видалити пункт меню підтримки приложения');
  }
}
