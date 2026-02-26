'use server';

import { revalidatePath } from 'next/cache';

import {
  createMenu,
  deleteMenu,
  reorderMenusSortOrder,
  updateMenuActive,
  updateMenuTitle,
} from '@/data/mx-dic/menus';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { menuTitleSchema } from '@/schemas/mx-admin/menu-schema';

/**
 * Server Action для створення нового меню
 */
export async function createMenuAction(title: string, menuTypeId: number): Promise<ActionStatus> {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return {
        status: 'error',
        message: 'Ви не авторизовані. Увійдіть в систему.',
        code: 'UNAUTHORIZED',
      };
    }

    if (admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    // Валідація через Zod схему
    const titleValidation = menuTitleSchema.safeParse(title);

    if (!titleValidation.success) {
      const errors = titleValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await createMenu(titleValidation.data, menuTypeId);

    console.log('[createMenuAction] Меню створено');

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');
    // Ревалідуємо layout для оновлення сайдбару (меню завантажується в layout)
    revalidatePath('/', 'layout');

    return {
      status: 'success',
      message: 'Меню успішно створено',
    };
  } catch (error) {
    console.error('[createMenuAction] Помилка створення меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при створенні меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення назви меню
 */
export async function updateMenuTitleAction(id: number, title: string): Promise<ActionStatus> {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    const titleValidation = menuTitleSchema.safeParse(title);

    if (!titleValidation.success) {
      const errors = titleValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await updateMenuTitle(id, titleValidation.data);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');
    // Ревалідуємо layout для оновлення сайдбару (меню завантажується в layout)
    revalidatePath('/', 'layout');

    return {
      status: 'success',
      message: 'Назву меню успішно оновлено',
    };
  } catch (error) {
    console.error('[updateMenuTitleAction] Помилка оновлення назви меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні назви меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для переключення активності меню
 */
export async function toggleMenuActiveAction(id: number, isActive: boolean): Promise<ActionStatus> {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    await updateMenuActive(id, isActive);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');
    // Ревалідуємо layout для оновлення сайдбару (меню завантажується в layout)
    revalidatePath('/', 'layout');

    return {
      status: 'success',
      message: `Меню ${isActive ? 'активовано' : 'деактивовано'}`,
    };
  } catch (error) {
    console.error('[toggleMenuActiveAction] Помилка оновлення активності меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні активності меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для видалення меню
 */
export async function deleteMenuAction(id: number): Promise<ActionStatus> {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    await deleteMenu(id);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');
    // Ревалідуємо layout для оновлення сайдбару (меню завантажується в layout)
    revalidatePath('/', 'layout');

    return {
      status: 'success',
      message: 'Меню успішно видалено',
    };
  } catch (error) {
    console.error('[deleteMenuAction] Помилка видалення меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при видаленні меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення порядку меню (для drag&drop)
 */
export async function reorderMenusAction(
  reorderedMenus: Array<{ id: number; sort_order: number }>
): Promise<ActionStatus> {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    // Оновлюємо порядок меню послідовно в одній транзакції (запобігає deadlock)
    await reorderMenusSortOrder(reorderedMenus);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');
    // Ревалідуємо layout для оновлення сайдбару (меню завантажується в layout)
    revalidatePath('/', 'layout');

    return {
      status: 'success',
      message: 'Порядок меню успішно оновлено',
    };
  } catch (error) {
    console.error('[reorderMenusAction] Помилка оновлення порядку меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні порядку меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}
