'use server';

import { revalidatePath } from 'next/cache';

import { updateOfficeSortOrder } from '@/data/mx-dic/offices';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для оновлення порядку офісів (drag&drop)
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

    // Оновлюємо порядок для кожного офісу
    await Promise.all(
      reorderedOffices.map((office) => updateOfficeSortOrder(office.id, office.sort_order))
    );

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
