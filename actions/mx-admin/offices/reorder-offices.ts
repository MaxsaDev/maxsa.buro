'use server';

import { revalidatePath } from 'next/cache';

import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { pool } from '@/lib/db';

/**
 * Server Action для оновлення порядку офісів (drag&drop)
 * Виконує всі оновлення в одній транзакції з тимчасовим
 * відключенням тригера sort_order, щоб уникнути конфліктів
 */
export async function reorderOfficesAction(
  reorderedOffices: Array<{ id: number; sort_order: number }>
): Promise<ActionStatus> {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Тимчасово відключаємо тригер reorder, бо ми самі керуємо sort_order
      await client.query(
        'ALTER TABLE mx_dic.offices DISABLE TRIGGER trg_offices_bu_sort_order_reorder'
      );

      // Послідовно оновлюємо sort_order з кроком 100
      for (const office of reorderedOffices) {
        await client.query('UPDATE mx_dic.offices SET sort_order = $1 WHERE id = $2', [
          office.sort_order * 100,
          office.id,
        ]);
      }

      // Вмикаємо тригер назад
      await client.query(
        'ALTER TABLE mx_dic.offices ENABLE TRIGGER trg_offices_bu_sort_order_reorder'
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    revalidatePath('/mx-admin/offices');

    return {
      status: 'success',
      message: 'Порядок офісів успішно оновлено',
    };
  } catch (error) {
    console.error('[reorderOfficesAction] Помилка оновлення порядку офісів:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні порядку офісів',
      code: 'UNKNOWN_ERROR',
    };
  }
}
