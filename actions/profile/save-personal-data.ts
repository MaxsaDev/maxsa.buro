'use server';

import {
  deleteOrphanedContacts,
  savePersonalDataWithContacts,
  userDataExists,
  type SaveContactData,
} from '@/data/mx-data/user-data';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Інтерфейс вхідних даних для збереження персональних даних
 */
interface ContactInput {
  contact_type_ids: number[];
  contact_value: string;
}

interface SavePersonalDataInput {
  full_name: string;
  contacts: ContactInput[];
}

/**
 * Server Action для збереження персональних даних користувача (повне ім'я + контакти)
 */
export async function savePersonalDataAction(data: SavePersonalDataInput): Promise<ActionStatus> {
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

    const { full_name, contacts } = data;

    // Валідація повного імені
    if (!full_name || full_name.trim().length < 2) {
      return {
        status: 'error',
        message: 'Введіть повне імʼя (мінімум 2 символи)',
        code: 'VALIDATION_ERROR',
      };
    }

    // Валідація контактів
    if (!contacts || contacts.length === 0) {
      return {
        status: 'error',
        message: 'Додайте мінімум один контакт',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка чи користувач вже має персональні дані
    const hasData = await userDataExists(user.id);

    if (hasData) {
      return {
        status: 'warning',
        message: 'Персональні дані вже збережені. Для зміни зверніться до адміністратора.',
      };
    }

    // Очистити "осиротілі" контакти від попередніх невдалих спроб
    const deletedCount = await deleteOrphanedContacts(user.id);
    if (deletedCount > 0) {
      console.log(
        `[savePersonalDataAction] Видалено ${deletedCount} осиротілих контактів для користувача ${user.id}`
      );
    }

    // Підготовка контактів для вставки
    const contactsToInsert: SaveContactData[] = contacts.flatMap((contact) =>
      contact.contact_type_ids.map((typeId, index) => ({
        userId: user.id,
        contactTypeId: typeId,
        contactValue: contact.contact_value,
        isDefault: contacts.indexOf(contact) === 0 && index === 0,
      }))
    );

    // Атомарне збереження персональних даних + контактів
    await savePersonalDataWithContacts(user.id, full_name, contactsToInsert);

    console.log(
      `[savePersonalDataAction] Успішно збережено персональні дані для користувача ${user.id}`
    );

    return {
      status: 'success',
      message: 'Персональні дані успішно збережено',
    };
  } catch (error) {
    console.error('[savePersonalDataAction] Помилка збереження персональних даних:', error);

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

      // Помилка унікальності is_default
      if (errorMessage.includes('user_contact_default_one_per_user_idx')) {
        return {
          status: 'error',
          message: 'Помилка збереження: конфлікт дефолтного контакту. Спробуйте ще раз.',
          code: 'DB_CONSTRAINT_ERROR',
        };
      }

      // Помилка цілісності даних
      if (errorMessage.includes('Порушення цілісності')) {
        return {
          status: 'error',
          message: 'Помилка збереження: необхідно додати мінімум один контакт',
          code: 'DB_INTEGRITY_ERROR',
        };
      }

      // Тип контакту деактивований
      if (errorMessage.includes('деактивований')) {
        return {
          status: 'error',
          message: 'Один або декілька типів контактів недоступні',
          code: 'DB_VALIDATION_ERROR',
        };
      }

      // Повертаємо оригінальне повідомлення для інших помилок БД
      return {
        status: 'error',
        message: errorMessage,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при збереженні персональних даних',
      code: 'UNKNOWN_ERROR',
    };
  }
}
