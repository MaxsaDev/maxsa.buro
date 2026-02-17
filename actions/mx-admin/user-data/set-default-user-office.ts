'use server';

import { revalidatePath } from 'next/cache';

import { updateUserOfficeDefault } from '@/data/mx-system/user-offices';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для встановлення офісу за замовчуванням для користувача
 */
export async function setDefaultUserOfficeAction(
  userId: string,
  officeId: number
): Promise<ActionStatus> {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return {
        status: 'error',
        message: 'Ви не авторизовані. Увійдіть в систему.',
        code: 'UNAUTHORIZED',
      };
    }

    if (admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    await updateUserOfficeDefault(userId, officeId);

    console.log(
      `[setDefaultUserOfficeAction] Офіс ${officeId} встановлено за замовчуванням для користувача ${userId}`
    );

    revalidatePath(`/mx-admin/user-data/${userId}`);
    revalidatePath('/(protected)', 'layout');

    return {
      status: 'success',
      message: 'Офіс за замовчуванням успішно встановлено',
    };
  } catch (error) {
    console.error(
      '[setDefaultUserOfficeAction] Помилка встановлення офісу за замовчуванням:',
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
      message: 'Невідома помилка при встановленні офісу за замовчуванням',
      code: 'UNKNOWN_ERROR',
    };
  }
}
