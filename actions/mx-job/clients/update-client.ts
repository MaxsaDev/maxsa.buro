'use server';

import { revalidatePath } from 'next/cache';

import {
  addClientContact,
  deleteClientContact,
  setClientDefaultContact,
  updateClientFullName,
} from '@/data/mx-data/clients';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { clientFullNameSchema, validateContactValue } from '@/schemas/mx-job/client-schema';

/**
 * Оновити повне ім'я клієнта без акаунту
 */
export async function updateClientFullNameAction(
  userDataId: string,
  fullName: string
): Promise<ActionStatus> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { status: 'error', message: 'Ви не авторизовані', code: 'UNAUTHORIZED' };
    }

    const validation = clientFullNameSchema.safeParse(fullName);
    if (!validation.success) {
      return {
        status: 'error',
        message: validation.error.issues[0]?.message || 'Некоректне імʼя',
        code: 'VALIDATION_ERROR',
      };
    }

    await updateClientFullName(userDataId, validation.data);
    revalidatePath(`/mx-job/clients/${userDataId}`);

    return { status: 'success', message: 'Імʼя клієнта успішно оновлено' };
  } catch (error) {
    console.error('[updateClientFullNameAction] Помилка:', error);
    if (error instanceof Error) {
      return { status: 'error', message: error.message, code: 'DB_ERROR' };
    }
    return { status: 'error', message: 'Невідома помилка', code: 'UNKNOWN_ERROR' };
  }
}

/**
 * Додати контакт клієнту без акаунту
 */
export async function addClientContactAction(
  userDataId: string,
  contactTypeId: number,
  contactTypeCode: string,
  contactValue: string
): Promise<ActionStatus> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { status: 'error', message: 'Ви не авторизовані', code: 'UNAUTHORIZED' };
    }

    // Валідація значення контакту
    const validation = validateContactValue(contactValue, contactTypeCode);
    if (!validation.success) {
      return {
        status: 'error',
        message: validation.error || 'Некоректне значення контакту',
        code: 'VALIDATION_ERROR',
      };
    }

    await addClientContact(userDataId, contactTypeId, contactValue);
    revalidatePath(`/mx-job/clients/${userDataId}`);

    return { status: 'success', message: 'Контакт успішно додано' };
  } catch (error) {
    console.error('[addClientContactAction] Помилка:', error);
    if (error instanceof Error) {
      return { status: 'error', message: error.message, code: 'DB_ERROR' };
    }
    return { status: 'error', message: 'Невідома помилка', code: 'UNKNOWN_ERROR' };
  }
}

/**
 * Встановити контакт клієнта за замовчуванням
 */
export async function setClientDefaultContactAction(
  userDataId: string,
  contactId: string
): Promise<ActionStatus> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { status: 'error', message: 'Ви не авторизовані', code: 'UNAUTHORIZED' };
    }

    await setClientDefaultContact(userDataId, contactId);
    revalidatePath(`/mx-job/clients/${userDataId}`);

    return { status: 'success', message: 'Основний контакт змінено' };
  } catch (error) {
    console.error('[setClientDefaultContactAction] Помилка:', error);
    if (error instanceof Error) {
      return { status: 'error', message: error.message, code: 'DB_ERROR' };
    }
    return { status: 'error', message: 'Невідома помилка', code: 'UNKNOWN_ERROR' };
  }
}

/**
 * Видалити контакт клієнта
 */
export async function deleteClientContactAction(
  userDataId: string,
  contactId: string
): Promise<ActionStatus> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { status: 'error', message: 'Ви не авторизовані', code: 'UNAUTHORIZED' };
    }

    await deleteClientContact(userDataId, contactId);
    revalidatePath(`/mx-job/clients/${userDataId}`);

    return { status: 'success', message: 'Контакт видалено' };
  } catch (error) {
    console.error('[deleteClientContactAction] Помилка:', error);
    if (error instanceof Error) {
      return { status: 'error', message: error.message, code: 'DB_ERROR' };
    }
    return { status: 'error', message: 'Невідома помилка', code: 'UNKNOWN_ERROR' };
  }
}
