'use server';

import { revalidatePath } from 'next/cache';

import { updateUserOfficeDefault } from '@/data/mx-system/user-offices';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для зміни офісу за замовчуванням поточним користувачем
 */
export async function setMyDefaultOfficeAction(officeId: number): Promise<ActionStatus> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        status: 'error',
        message: 'Ви не авторизовані. Увійдіть в систему.',
        code: 'UNAUTHORIZED',
      };
    }

    await updateUserOfficeDefault(user.id, officeId);

    revalidatePath('/(protected)', 'layout');

    return {
      status: 'success',
      message: 'Офіс за замовчуванням успішно змінено',
    };
  } catch (error) {
    console.error(
      '[setMyDefaultOfficeAction] Помилка зміни офісу за замовчуванням:',
      error
    );

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при зміні офісу за замовчуванням',
      code: 'UNKNOWN_ERROR',
    };
  }
}
