'use server';

import { revalidatePath } from 'next/cache';

import {
  createMenuAppSupport,
  createMenuUserItem,
  createMenuUserSectionsCategory,
  createMenuUserSectionsItem,
} from '@/data/mx-dic/menu-admin';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { menuIconSchema, menuTitleSchema, menuUrlSchema } from '@/schemas/mx-admin/menu-schema';

/**
 * Server Action для створення нової категорії меню користувача з секціями
 */
export async function createMenuUserSectionsCategoryAction(
  menuId: number,
  title: string,
  url: string,
  icon: string
): Promise<ActionStatus> {
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

    // Валідація через Zod схеми
    const titleValidation = menuTitleSchema.safeParse(title);
    const urlValidation = menuUrlSchema.safeParse(url);
    const iconValidation = menuIconSchema.safeParse(icon);

    if (!titleValidation.success) {
      const errors = titleValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва категорії меню',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!urlValidation.success) {
      const errors = urlValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний URL категорії меню',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!iconValidation.success) {
      const errors = iconValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва іконки',
        code: 'VALIDATION_ERROR',
      };
    }

    await createMenuUserSectionsCategory(
      menuId,
      titleValidation.data,
      urlValidation.data,
      iconValidation.data
    );

    console.log('[createMenuUserSectionsCategoryAction] Категорію меню створено');

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Категорію меню успішно створено',
    };
  } catch (error) {
    console.error(
      '[createMenuUserSectionsCategoryAction] Помилка створення категорії меню:',
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
      message: 'Невідома помилка при створенні категорії меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для створення нового пункту меню користувача з секціями
 */
export async function createMenuUserSectionsItemAction(
  categoryId: number,
  title: string,
  url: string,
  icon: string
): Promise<ActionStatus> {
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

    // Валідація через Zod схеми
    const titleValidation = menuTitleSchema.safeParse(title);
    const urlValidation = menuUrlSchema.safeParse(url);
    const iconValidation = menuIconSchema.safeParse(icon);

    if (!titleValidation.success) {
      const errors = titleValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!urlValidation.success) {
      const errors = urlValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний URL пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!iconValidation.success) {
      const errors = iconValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва іконки',
        code: 'VALIDATION_ERROR',
      };
    }

    await createMenuUserSectionsItem(
      categoryId,
      titleValidation.data,
      urlValidation.data,
      iconValidation.data
    );

    console.log('[createMenuUserSectionsItemAction] Пункт меню створено');

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Пункт меню успішно створено',
    };
  } catch (error) {
    console.error('[createMenuUserSectionsItemAction] Помилка створення пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при створенні пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для створення нового пункту меню користувача (без секцій)
 */
export async function createMenuUserItemAction(
  menuId: number,
  title: string,
  url: string,
  icon: string
): Promise<ActionStatus> {
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

    // Валідація через Zod схеми
    const titleValidation = menuTitleSchema.safeParse(title);
    const urlValidation = menuUrlSchema.safeParse(url);
    const iconValidation = menuIconSchema.safeParse(icon);

    if (!titleValidation.success) {
      const errors = titleValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!urlValidation.success) {
      const errors = urlValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний URL пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!iconValidation.success) {
      const errors = iconValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва іконки',
        code: 'VALIDATION_ERROR',
      };
    }

    await createMenuUserItem(menuId, titleValidation.data, urlValidation.data, iconValidation.data);

    console.log('[createMenuUserItemAction] Пункт меню створено');

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Пункт меню успішно створено',
    };
  } catch (error) {
    console.error('[createMenuUserItemAction] Помилка створення пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при створенні пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для створення нового пункту меню підтримки приложения
 */
export async function createMenuAppSupportAction(
  menuId: number,
  title: string,
  url: string,
  icon: string
): Promise<ActionStatus> {
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

    // Валідація через Zod схеми
    const titleValidation = menuTitleSchema.safeParse(title);
    const urlValidation = menuUrlSchema.safeParse(url);
    const iconValidation = menuIconSchema.safeParse(icon);

    if (!titleValidation.success) {
      const errors = titleValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!urlValidation.success) {
      const errors = urlValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний URL пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!iconValidation.success) {
      const errors = iconValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва іконки',
        code: 'VALIDATION_ERROR',
      };
    }

    await createMenuAppSupport(
      menuId,
      titleValidation.data,
      urlValidation.data,
      iconValidation.data
    );

    console.log('[createMenuAppSupportAction] Пункт меню створено');

    revalidatePath('/mx-admin/menu-app');
    revalidatePath('/', 'layout');

    return {
      status: 'success',
      message: 'Пункт меню успішно створено',
    };
  } catch (error) {
    console.error('[createMenuAppSupportAction] Помилка створення пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при створенні пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}
