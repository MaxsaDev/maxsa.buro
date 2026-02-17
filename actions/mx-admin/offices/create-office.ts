'use server';

import { revalidatePath } from 'next/cache';

import { createOffice } from '@/data/mx-dic/offices';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { officeTitleSchema } from '@/schemas/mx-admin/offices-schema';

/**
 * Server Action для створення нового офісу
 */
export async function createOfficeAction(title: string): Promise<ActionStatus> {
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

    // Валідація через Zod схему
    const titleValidation = officeTitleSchema.safeParse(title);

    if (!titleValidation.success) {
      const errors = titleValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва офісу',
        code: 'VALIDATION_ERROR',
      };
    }

    await createOffice(titleValidation.data);

    console.log('[createOfficeAction] Офіс створено');

    revalidatePath('/mx-admin/offices');

    return {
      status: 'success',
      message: 'Офіс успішно створено',
    };
  } catch (error) {
    console.error('[createOfficeAction] Помилка створення офісу:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при створенні офісу',
      code: 'UNKNOWN_ERROR',
    };
  }
}
