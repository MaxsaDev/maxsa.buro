'use server';

import { revalidatePath } from 'next/cache';

import { setDefaultContact } from '@/data/mx-data/user-contact';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для встановлення контакту за замовчуванням
 */
export async function setDefaultContactAction(contactId: string): Promise<ActionStatus> {
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

    // Валідація
    if (!contactId) {
      return {
        status: 'error',
        message: 'ID контакту не вказано',
        code: 'VALIDATION_ERROR',
      };
    }

    // Встановлення дефолтного контакту
    await setDefaultContact(user.id, contactId);

    console.log(
      `[setDefaultContactAction] Контакт ${contactId} встановлено за замовчуванням для користувача ${user.id}`
    );

    // Ревалідуємо сторінку профілю
    revalidatePath('/profile');

    return {
      status: 'success',
      message: 'Контакт за замовчуванням змінено',
    };
  } catch (error) {
    console.error(
      '[setDefaultContactAction] Помилка встановлення контакту за замовчуванням:',
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
      message: 'Невідома помилка при встановленні контакту за замовчуванням',
      code: 'UNKNOWN_ERROR',
    };
  }
}
