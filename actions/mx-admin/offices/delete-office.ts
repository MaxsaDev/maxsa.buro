'use server';

import { revalidatePath } from 'next/cache';

import { deleteOffice } from '@/data/mx-dic/offices';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для видалення офісу
 */
export async function deleteOfficeAction(id: number): Promise<ActionStatus> {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    await deleteOffice(id);

    revalidatePath('/mx-admin/offices');

    return {
      status: 'success',
      message: 'Офіс успішно видалено',
    };
  } catch (error) {
    console.error('[deleteOfficeAction] Помилка видалення офісу:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при видаленні офісу',
      code: 'UNKNOWN_ERROR',
    };
  }
}
