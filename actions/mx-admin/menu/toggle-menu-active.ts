'use server';

import { revalidatePath } from 'next/cache';

import {
  updateMenuAppSupportActive,
  updateMenuUserItemsActive,
  updateMenuUserSectionsCategoryActive,
  updateMenuUserSectionsItemsActive,
} from '@/data/mx-dic/menu-admin';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для переключення активності пункту меню користувача (без секцій)
 */
export async function toggleMenuUserItemsActiveAction(
  id: number,
  isActive: boolean
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
    await updateMenuUserItemsActive(id, isActive);

    console.log(
      `[toggleMenuUserItemsActiveAction] Пункт меню ${id} ${isActive ? 'активовано' : 'деактивовано'}`
    );

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: `Пункт меню ${isActive ? 'активовано' : 'деактивовано'}`,
    };
  } catch (error) {
    console.error('[toggleMenuUserItemsActiveAction] Помилка переключення активності:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при переключенні активності пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для переключення активності пункту меню користувача з секціями
 */
export async function toggleMenuUserSectionsItemsActiveAction(
  id: number,
  isActive: boolean
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
    await updateMenuUserSectionsItemsActive(id, isActive);

    console.log(
      `[toggleMenuUserSectionsItemsActiveAction] Пункт меню ${id} ${isActive ? 'активовано' : 'деактивовано'}`
    );

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: `Пункт меню ${isActive ? 'активовано' : 'деактивовано'}`,
    };
  } catch (error) {
    console.error(
      '[toggleMenuUserSectionsItemsActiveAction] Помилка переключення активності:',
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
      message: 'Невідома помилка при переключенні активності пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для переключення активності категорії меню користувача з секціями
 */
export async function toggleMenuUserSectionsCategoryActiveAction(
  id: number,
  isActive: boolean
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
    await updateMenuUserSectionsCategoryActive(id, isActive);

    console.log(
      `[toggleMenuUserSectionsCategoryActiveAction] Категорія меню ${id} ${isActive ? 'активовано' : 'деактивовано'}`
    );

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: `Категорія меню ${isActive ? 'активовано' : 'деактивовано'}`,
    };
  } catch (error) {
    console.error(
      '[toggleMenuUserSectionsCategoryActiveAction] Помилка переключення активності:',
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
      message: 'Невідома помилка при переключенні активності категорії меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для переключення активності пункту меню підтримки приложения
 */
export async function toggleMenuAppSupportActiveAction(
  id: number,
  isActive: boolean
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
    await updateMenuAppSupportActive(id, isActive);

    console.log(
      `[toggleMenuAppSupportActiveAction] Пункт меню підтримки ${id} ${isActive ? 'активовано' : 'деактивовано'}`
    );

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: `Пункт меню підтримки ${isActive ? 'активовано' : 'деактивовано'}`,
    };
  } catch (error) {
    console.error('[toggleMenuAppSupportActiveAction] Помилка переключення активності:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при переключенні активності пункту меню підтримки',
      code: 'UNKNOWN_ERROR',
    };
  }
}
