'use server';

import { revalidatePath } from 'next/cache';

import { deleteUserContact } from '@/data/mx-data/user-contact';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для видалення контакту
 */
export async function deleteContactAction(contactId: string): Promise<ActionStatus> {
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

    // Видалення контакту
    await deleteUserContact(user.id, contactId);

    console.log(`[deleteContactAction] Контакт ${contactId} видалено для користувача ${user.id}`);

    // Ревалідуємо сторінку профілю
    revalidatePath('/profile');

    return {
      status: 'success',
      message: 'Контакт успішно видалено',
    };
  } catch (error) {
    console.error('[deleteContactAction] Помилка видалення контакту:', error);

    if (error instanceof Error) {
      const errorMessage = error.message;

      // Помилка цілісності (якщо це єдиний контакт і є тригер перевірки)
      if (
        errorMessage.includes('Порушення цілісності') ||
        errorMessage.includes('мінімум один контакт')
      ) {
        return {
          status: 'error',
          message:
            'Неможливо видалити єдиний контакт. Додайте інший контакт перед видаленням цього.',
          code: 'DB_INTEGRITY_ERROR',
        };
      }

      return {
        status: 'error',
        message: errorMessage,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при видаленні контакту',
      code: 'UNKNOWN_ERROR',
    };
  }
}
