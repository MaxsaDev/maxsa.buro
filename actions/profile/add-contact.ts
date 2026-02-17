'use server';

import { revalidatePath } from 'next/cache';

import { createUserContact } from '@/data/mx-data/user-contact';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Інтерфейс вхідних даних для додавання контакту
 */
export interface AddContactInput {
  contact_type_ids: number[];
  contact_value: string;
}

/**
 * Server Action для додавання нового контакту
 */
export async function addContactAction(data: AddContactInput): Promise<ActionStatus> {
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

    const { contact_type_ids, contact_value } = data;

    // Валідація
    if (!contact_type_ids || contact_type_ids.length === 0) {
      return {
        status: 'error',
        message: 'Виберіть мінімум один тип контакту',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!contact_value || contact_value.trim().length === 0) {
      return {
        status: 'error',
        message: 'Введіть значення контакту',
        code: 'VALIDATION_ERROR',
      };
    }

    // Додавання контактів (кожен тип окремо)
    const addedContacts: string[] = [];

    for (const typeId of contact_type_ids) {
      try {
        await createUserContact({
          userId: user.id,
          contactTypeId: typeId,
          contactValue: contact_value.trim(),
          isDefault: false, // Нові контакти не є дефолтними
        });
        addedContacts.push(`Тип ${typeId}`);
      } catch (error) {
        console.error(`[addContactAction] Помилка додавання контакту type_id=${typeId}:`, error);
        // Продовжуємо додавати інші типи
      }
    }

    if (addedContacts.length === 0) {
      return {
        status: 'error',
        message: 'Не вдалося додати жоден контакт. Можливо, такі контакти вже існують.',
        code: 'DB_ERROR',
      };
    }

    console.log(
      `[addContactAction] Додано ${addedContacts.length} контактів для користувача ${user.id}`
    );

    // Ревалідуємо сторінку профілю
    revalidatePath('/profile');

    return {
      status: 'success',
      message: `Успішно додано ${addedContacts.length} контактів`,
    };
  } catch (error) {
    console.error('[addContactAction] Помилка додавання контакту:', error);

    // Обробка помилок з БД (включаючи валідацію з тригерів)
    if (error instanceof Error) {
      const errorMessage = error.message;

      // Помилки валідації з триггера fn_user_contact_bi_validate
      if (errorMessage.includes('Некоректний')) {
        return {
          status: 'error',
          message: errorMessage,
          code: 'DB_VALIDATION_ERROR',
        };
      }

      // Помилка дублювання
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        return {
          status: 'error',
          message: 'Такий контакт вже існує',
          code: 'DB_CONSTRAINT_ERROR',
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
      message: 'Невідома помилка при додаванні контакту',
      code: 'UNKNOWN_ERROR',
    };
  }
}
