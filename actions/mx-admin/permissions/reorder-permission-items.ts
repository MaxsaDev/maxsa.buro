'use server';

import { pool } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface ReorderItem {
  id: number;
  sort_order: number;
}

/**
 * Оновити порядок пунктів повноважень
 */
export async function reorderPermissionItems(
  items: ReorderItem[]
): Promise<{ success: boolean; message: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of items) {
      await client.query('UPDATE mx_dic.user_permissions_items SET sort_order = $1 WHERE id = $2', [
        item.sort_order,
        item.id,
      ]);
    }

    await client.query('COMMIT');
    revalidatePath('/mx-admin/permissions');
    return { success: true, message: 'Порядок пунктів повноважень успішно оновлено' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[reorderPermissionItems] Помилка оновлення порядку:', error);
    throw new Error('Не вдалося оновити порядок пунктів повноважень');
  } finally {
    client.release();
  }
}
