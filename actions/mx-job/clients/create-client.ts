'use server';

import { revalidatePath } from 'next/cache';

import { checkDuplicateContact, createClientWithContacts } from '@/data/mx-data/clients';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { clientFullNameSchema, clientLegalSchema } from '@/schemas/mx-job/client-schema';
import { validateContactValue } from '@/schemas/profile/personal-data-schema';

interface ContactInput {
  contact_type_id: number;
  contact_type_code: string;
  contact_value: string;
}

interface LegalInput {
  data_edrpou: string;
  data_address?: string;
  data_address_legal?: string;
  phone?: string;
  email?: string;
  tin?: string;
  data_account?: string;
  data_bank?: string;
  mfo_bank?: string;
  post_director?: string;
  data_director?: string;
  phone_director?: string;
  data_accountant?: string;
  phone_accountant?: string;
  data_contact?: string;
  phone_contact?: string;
  description?: string;
}

interface CreateClientInput {
  full_name: string;
  contacts: ContactInput[];
  legal?: LegalInput;
}

interface CreateClientSuccessStatus {
  status: 'success';
  message: string;
  user_data_id: string;
}

/**
 * Server Action для створення нового клієнта
 */
export async function createClientAction(
  data: CreateClientInput
): Promise<ActionStatus | CreateClientSuccessStatus> {
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

    const { full_name, contacts, legal } = data;

    // Валідація повного імені
    const nameValidation = clientFullNameSchema.safeParse(full_name);
    if (!nameValidation.success) {
      return {
        status: 'error',
        message: nameValidation.error.issues[0]?.message || 'Некоректне імʼя клієнта',
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

    // Валідація кожного контакту
    for (const contact of contacts) {
      const validation = validateContactValue(contact.contact_value, contact.contact_type_code);
      if (!validation.success) {
        return {
          status: 'error',
          message: `Некоректний контакт: ${validation.error}`,
          code: 'VALIDATION_ERROR',
        };
      }
    }

    // Перевірка дублікатів по контактах
    for (const contact of contacts) {
      const duplicate = await checkDuplicateContact(contact.contact_value, contact.contact_type_id);

      if (duplicate.exists) {
        return {
          status: 'warning',
          message: `Клієнт з таким контактом вже існує: ${duplicate.full_name} (${duplicate.contact_value})`,
          code: 'DUPLICATE_CONTACT',
        } as ActionStatus;
      }
    }

    // Валідація юридичних даних (якщо передані)
    if (legal) {
      const legalValidation = clientLegalSchema.safeParse(legal);
      if (!legalValidation.success) {
        return {
          status: 'error',
          message: legalValidation.error.issues[0]?.message || 'Некоректні юридичні дані',
          code: 'VALIDATION_ERROR',
        };
      }
    }

    // Підготовка контактів: перший контакт — дефолтний
    const contactsToInsert = contacts.map((contact, index) => ({
      contactTypeId: contact.contact_type_id,
      contactValue: contact.contact_value,
      isDefault: index === 0,
    }));

    // Атомарне збереження клієнта
    const result = await createClientWithContacts({
      fullName: nameValidation.data,
      contacts: contactsToInsert,
      legal: legal || undefined,
    });

    revalidatePath('/mx-job/clients');

    console.log(
      `[createClientAction] Успішно створено клієнта ${nameValidation.data} (${result.user_data_id}) автором ${user.id}`
    );

    return {
      status: 'success',
      message: `Клієнта "${nameValidation.data}" успішно створено`,
      user_data_id: result.user_data_id,
    };
  } catch (error) {
    console.error('[createClientAction] Помилка створення клієнта:', error);

    if (error instanceof Error) {
      const msg = error.message;

      if (msg.includes('Некоректний')) {
        return { status: 'error', message: msg, code: 'DB_VALIDATION_ERROR' };
      }

      if (msg.includes('Порушення цілісності')) {
        return {
          status: 'error',
          message: 'Помилка: необхідно додати мінімум один контакт',
          code: 'DB_INTEGRITY_ERROR',
        };
      }

      if (msg.includes('деактивований')) {
        return {
          status: 'error',
          message: 'Один або декілька типів контактів недоступні',
          code: 'DB_VALIDATION_ERROR',
        };
      }

      return { status: 'error', message: msg, code: 'DB_ERROR' };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при створенні клієнта',
      code: 'UNKNOWN_ERROR',
    };
  }
}
