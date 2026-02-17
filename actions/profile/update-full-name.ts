'use server';

import { revalidatePath } from 'next/cache';

import { updateUserDataFullName } from '@/data/mx-data/user-data';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { fullNameSchema } from '@/schemas/profile/personal-data-schema';

/**
 * Server Action для оновлення повного імені користувача через EditDbMaxsa
 * Приймає ID запису user_data (UUID) та нове значення full_name
 */
export async function updateFullNameByIdAction(
  userDataId: number | string,
  fullName: string
): Promise<ActionStatus> {
  try {
    // Перевірка авторизації
    const user = await getCurrentUser();

    if (!user) {
      return {
        status: 'error',
        message: 'Ви не авторизовані. Увійдіть в систему.',
        code: 'UNAUTHORIZED',
      };
    }

    // Перевірка типу ID (для user_data ID завжди строка UUID)
    if (typeof userDataId !== 'string') {
      return {
        status: 'error',
        message: 'Некоректний тип ID',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка що user_data_id належить поточному користувачу
    const { getUserDataByUserId } = await import('@/data/mx-data/user-data');
    const userData = await getUserDataByUserId(user.id);

    if (!userData || userData.id !== userDataId) {
      return {
        status: 'error',
        message: 'Немає доступу до цього запису',
        code: 'FORBIDDEN',
      };
    }

    // Валідація повного імені через Zod
    const validation = fullNameSchema.safeParse(fullName);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректне повне імʼя',
        code: 'VALIDATION_ERROR',
      };
    }

    // Оновлення в БД
    await updateUserDataFullName(user.id, validation.data);

    console.log(`[updateFullNameByIdAction] Повне імʼя оновлено для користувача ${user.id}`);

    // Ревалідуємо сторінку профілю
    revalidatePath('/profile');

    return {
      status: 'success',
      message: 'Повне імʼя успішно оновлено',
    };
  } catch (error) {
    console.error('[updateFullNameByIdAction] Помилка оновлення повного імені:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні повного імені',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення повного імені користувача
 */
export async function updateFullNameAction(fullName: string): Promise<ActionStatus> {
  try {
    // Перевірка авторизації
    const user = await getCurrentUser();

    if (!user) {
      return {
        status: 'error',
        message: 'Ви не авторизовані. Увійдіть в систему.',
        code: 'UNAUTHORIZED',
      };
    }

    // Валідація повного імені через Zod
    const validation = fullNameSchema.safeParse(fullName);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректне повне імʼя',
        code: 'VALIDATION_ERROR',
      };
    }

    // Оновлення в БД
    await updateUserDataFullName(user.id, validation.data);

    console.log(`[updateFullNameAction] Повне імʼя оновлено для користувача ${user.id}`);

    // Ревалідуємо сторінку профілю
    revalidatePath('/profile');

    return {
      status: 'success',
      message: 'Повне імʼя успішно оновлено',
    };
  } catch (error) {
    console.error('[updateFullNameAction] Помилка оновлення повного імені:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні повного імені',
      code: 'UNKNOWN_ERROR',
    };
  }
}
