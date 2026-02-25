'use server';

import { pool } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface ReorderItem {
  id: number;
  sort_order: number;
}

/**
 * Оновити порядок пунктів меню користувача з секціями
 */
export async function reorderMenuUserSectionsItems(
  items: ReorderItem[]
): Promise<{ success: boolean; message: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of items) {
      await client.query(
        'UPDATE mx_dic.menu_user_sections_items SET sort_order = $1 WHERE id = $2',
        [item.sort_order, item.id]
      );
    }

    await client.query('COMMIT');
    revalidatePath('/mx-admin/menu-app');
    return { success: true, message: 'Порядок пунктів меню успішно оновлено' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[reorderMenuUserSectionsItems] Помилка оновлення порядку:', error);
    throw new Error('Не вдалося оновити порядок пунктів меню');
  } finally {
    client.release();
  }
}

/**
 * Оновити порядок пунктів загального меню
 */
export async function reorderMenuGeneralItems(
  items: ReorderItem[]
): Promise<{ success: boolean; message: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of items) {
      await client.query('UPDATE mx_dic.menu_general_items SET sort_order = $1 WHERE id = $2', [
        item.sort_order,
        item.id,
      ]);
    }

    await client.query('COMMIT');
    revalidatePath('/mx-admin/menu-app');
    return { success: true, message: 'Порядок пунктів загального меню успішно оновлено' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[reorderMenuGeneralItems] Помилка оновлення порядку:', error);
    throw new Error('Не вдалося оновити порядок пунктів загального меню');
  } finally {
    client.release();
  }
}

/**
 * Оновити порядок пунктів меню користувача (без секцій)
 */
export async function reorderMenuUserItems(
  items: ReorderItem[]
): Promise<{ success: boolean; message: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of items) {
      await client.query('UPDATE mx_dic.menu_user_items SET sort_order = $1 WHERE id = $2', [
        item.sort_order,
        item.id,
      ]);
    }

    await client.query('COMMIT');
    revalidatePath('/mx-admin/menu-app');
    return { success: true, message: 'Порядок пунктів меню успішно оновлено' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[reorderMenuUserItems] Помилка оновлення порядку:', error);
    throw new Error('Не вдалося оновити порядок пунктів меню');
  } finally {
    client.release();
  }
}
