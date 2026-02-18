'use server';

import { revalidatePath } from 'next/cache';

import { isNameTaken, updateUserName } from '@/data/auth/user';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { OnlyLatinLetters } from '@/schemas/schema_regex';

/**
 * Функція для перевірки чи є імʼя системним (user_xxxxx)
 */
const isSystemGeneratedName = (name: string): boolean => {
  return /^user_[a-z0-9]+_[a-z0-9]+$/i.test(name);
};

/**
 * Server Action для оновлення імені користувача
 */
export const updateNameAction = async (
  _prevState: ActionStatus | null,
  formData: FormData
): Promise<ActionStatus> => {
  try {
    // Перевіряємо чи користувач авторизований
    const user = await getCurrentUser();

    if (!user) {
      return {
        status: 'error',
        message: 'Ви не авторизовані. Увійдіть в систему.',
        code: 'UNAUTHORIZED',
      };
    }

    // Перевіряємо чи поточне ім'я системне (якщо ні - заборонено змінювати)
    if (!isSystemGeneratedName(user.name)) {
      return {
        status: 'error',
        message: 'Імʼя вже було змінено раніше і не може бути змінено повторно',
        code: 'NAME_ALREADY_CHANGED',
      };
    }

    // Отримуємо нове ім'я з форми
    const newName = formData.get('name') as string;

    // Валідація
    if (!newName || newName.length < 2) {
      return {
        status: 'error',
        message: 'Імʼя має містити щонайменше 2 символи',
        code: 'VALIDATION_ERROR',
      };
    }

    if (newName.length > 30) {
      return {
        status: 'error',
        message: 'Імʼя не повинне бути довшим за 30 символів',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!OnlyLatinLetters.test(newName)) {
      return {
        status: 'error',
        message: 'Імʼя може містити лише латинські літери, без пробілів',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевіряємо чи ім'я не зайняте іншим користувачем
    const nameTaken = await isNameTaken(newName, user.id);

    if (nameTaken) {
      return {
        status: 'error',
        message: 'Це імʼя вже зайняте іншим користувачем',
        code: 'NAME_TAKEN',
      };
    }

    // Оновлюємо ім'я в базі даних
    await updateUserName(user.id, newName);

    console.log('[updateNameAction] Імʼя успішно оновлено для користувача:', user.email);

    // Ревалідуємо сторінки з інформацією про користувача
    revalidatePath('/profile');
    revalidatePath('/mx-job');

    return {
      status: 'success',
      message: 'Імʼя успішно оновлено',
    };
  } catch (error) {
    console.error('[updateNameAction] Помилка оновлення імені:', error);

    return {
      status: 'error',
      message: 'Помилка при оновленні імені. Спробуйте пізніше.',
      code: 'UNKNOWN_ERROR',
    };
  }
};
