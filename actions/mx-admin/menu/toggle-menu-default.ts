'use server';

import { revalidatePath } from 'next/cache';

import {
  updateMenuUserItemsDefault,
  updateMenuUserSectionsItemsDefault,
} from '@/data/mx-dic/menu-admin';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для переключення is_default пункту меню користувача (без секцій)
 */
export async function toggleMenuUserItemsDefaultAction(
  id: number,
  isDefault: boolean
): Promise<ActionStatus> {
  try {
    // Перевірка авторизації
    const admin = await getCurrentUser();

    if (!admin) {
      return {
        status: 'error',
        message: 'Ви не авторизовані. Увійдіть в систему.',
        code: 'UNAUTHORIZED',
      };
    }

    // Перевірка ролі адміністратора
    if (admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    // Оновлення в БД
    await updateMenuUserItemsDefault(id, isDefault);

    console.log(
      `[toggleMenuUserItemsDefaultAction] Пункт меню ${id} ${isDefault ? 'встановлено' : 'знято'} як меню за замовчуванням`
    );

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: `Пункт меню ${isDefault ? 'встановлено' : 'знято'} як меню за замовчуванням`,
    };
  } catch (error) {
    console.error('[toggleMenuUserItemsDefaultAction] Помилка переключення is_default:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при переключенні is_default пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для переключення is_default пункту меню користувача з секціями
 */
export async function toggleMenuUserSectionsItemsDefaultAction(
  id: number,
  isDefault: boolean
): Promise<ActionStatus> {
  try {
    // Перевірка авторизації
    const admin = await getCurrentUser();

    if (!admin) {
      return {
        status: 'error',
        message: 'Ви не авторизовані. Увійдіть в систему.',
        code: 'UNAUTHORIZED',
      };
    }

    // Перевірка ролі адміністратора
    if (admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    // Оновлення в БД
    await updateMenuUserSectionsItemsDefault(id, isDefault);

    console.log(
      `[toggleMenuUserSectionsItemsDefaultAction] Пункт меню ${id} ${isDefault ? 'встановлено' : 'знято'} як меню за замовчуванням`
    );

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: `Пункт меню ${isDefault ? 'встановлено' : 'знято'} як меню за замовчуванням`,
    };
  } catch (error) {
    console.error(
      '[toggleMenuUserSectionsItemsDefaultAction] Помилка переключення is_default:',
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
      message: 'Невідома помилка при переключенні is_default пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}
