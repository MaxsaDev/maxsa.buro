'use server';

import { revalidatePath } from 'next/cache';

import { updateOfficeActive } from '@/data/mx-dic/offices';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для переключення активності офісу
 */
export async function toggleOfficeActiveAction(
  id: number,
  isActive: boolean
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

    await updateOfficeActive(id, isActive);

    revalidatePath('/mx-admin/offices');

    return {
      status: 'success',
      message: `Офіс ${isActive ? 'активовано' : 'деактивовано'}`,
    };
  } catch (error) {
    console.error('[toggleOfficeActiveAction] Помилка оновлення активності офісу:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні активності офісу',
      code: 'UNKNOWN_ERROR',
    };
  }
}
