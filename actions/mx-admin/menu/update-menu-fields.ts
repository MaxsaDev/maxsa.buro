'use server';

import { revalidatePath } from 'next/cache';

import {
  updateMenuGeneralItemIcon,
  updateMenuGeneralItemTitle,
  updateMenuGeneralItemUrl,
} from '@/data/mx-dic/menu-general';
import {
  updateMenuAppSupportIcon,
  updateMenuAppSupportTitle,
  updateMenuAppSupportUrl,
  updateMenuUserItemsIcon,
  updateMenuUserItemsTitle,
  updateMenuUserItemsUrl,
  updateMenuUserSectionsCategoryIcon,
  updateMenuUserSectionsCategoryTitle,
  updateMenuUserSectionsCategoryUrl,
  updateMenuUserSectionsItemsIcon,
  updateMenuUserSectionsItemsTitle,
  updateMenuUserSectionsItemsUrl,
} from '@/data/mx-dic/menu-admin';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { menuIconSchema, menuTitleSchema, menuUrlSchema } from '@/schemas/mx-admin/menu-schema';

/**
 * Server Action для оновлення назви пункту меню користувача (без секцій)
 */
export async function updateMenuUserItemsTitleAction(
  id: number | string,
  title: string
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

    // Валідація через Zod схему
    const validation = menuTitleSchema.safeParse(title);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Оновлення в БД
    await updateMenuUserItemsTitle(menuId, validation.data);

    console.log(`[updateMenuUserItemsTitleAction] Назву пункту меню ${id} оновлено`);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');
    // Ревалідуємо layout для оновлення сайдбару (меню завантажується в layout)
    revalidatePath('/', 'layout');

    return {
      status: 'success',
      message: 'Назву пункту меню успішно оновлено',
    };
  } catch (error) {
    console.error('[updateMenuUserItemsTitleAction] Помилка оновлення назви пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні назви пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення URL пункту меню користувача (без секцій)
 */
export async function updateMenuUserItemsUrlAction(
  id: number | string,
  url: string
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

    // Валідація через Zod схему
    const validation = menuUrlSchema.safeParse(url);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний URL пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Оновлення в БД
    await updateMenuUserItemsUrl(menuId, validation.data);

    console.log(`[updateMenuUserItemsUrlAction] URL пункту меню ${id} оновлено`);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'URL пункту меню успішно оновлено',
    };
  } catch (error) {
    console.error('[updateMenuUserItemsUrlAction] Помилка оновлення URL пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні URL пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення назви пункту меню користувача з секціями
 */
export async function updateMenuUserSectionsItemsTitleAction(
  id: number | string,
  title: string
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

    // Валідація через Zod схему
    const validation = menuTitleSchema.safeParse(title);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Оновлення в БД
    await updateMenuUserSectionsItemsTitle(menuId, validation.data);

    console.log(`[updateMenuUserSectionsItemsTitleAction] Назву пункту меню ${id} оновлено`);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');
    // Ревалідуємо layout для оновлення сайдбару (меню завантажується в layout)
    revalidatePath('/', 'layout');

    return {
      status: 'success',
      message: 'Назву пункту меню успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsItemsTitleAction] Помилка оновлення назви пункту меню:',
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
      message: 'Невідома помилка при оновленні назви пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення URL пункту меню користувача з секціями
 */
export async function updateMenuUserSectionsItemsUrlAction(
  id: number | string,
  url: string
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

    // Валідація через Zod схему
    const validation = menuUrlSchema.safeParse(url);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний URL пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Оновлення в БД
    await updateMenuUserSectionsItemsUrl(menuId, validation.data);

    console.log(`[updateMenuUserSectionsItemsUrlAction] URL пункту меню ${id} оновлено`);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'URL пункту меню успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsItemsUrlAction] Помилка оновлення URL пункту меню:',
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
      message: 'Невідома помилка при оновленні URL пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення назви категорії меню користувача з секціями
 */
export async function updateMenuUserSectionsCategoryTitleAction(
  id: number | string,
  title: string
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

    // Валідація через Zod схему
    const validation = menuTitleSchema.safeParse(title);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва категорії меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID категорії меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Оновлення в БД
    await updateMenuUserSectionsCategoryTitle(menuId, validation.data);

    console.log(`[updateMenuUserSectionsCategoryTitleAction] Назву категорії меню ${id} оновлено`);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Назву категорії меню успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsCategoryTitleAction] Помилка оновлення назви категорії меню:',
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
      message: 'Невідома помилка при оновленні назви категорії меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення URL категорії меню користувача з секціями
 */
export async function updateMenuUserSectionsCategoryUrlAction(
  id: number | string,
  url: string
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

    // Валідація через Zod схему
    const validation = menuUrlSchema.safeParse(url);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний URL категорії меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID категорії меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Оновлення в БД
    await updateMenuUserSectionsCategoryUrl(menuId, validation.data);

    console.log(`[updateMenuUserSectionsCategoryUrlAction] URL категорії меню ${id} оновлено`);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'URL категорії меню успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsCategoryUrlAction] Помилка оновлення URL категорії меню:',
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
      message: 'Невідома помилка при оновленні URL категорії меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення назви пункту меню підтримки приложения
 */
export async function updateMenuAppSupportTitleAction(
  id: number | string,
  title: string
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

    // Валідація через Zod схему
    const validation = menuTitleSchema.safeParse(title);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Оновлення в БД
    await updateMenuAppSupportTitle(menuId, validation.data);

    console.log(`[updateMenuAppSupportTitleAction] Назву пункту меню ${id} оновлено`);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Назву пункту меню успішно оновлено',
    };
  } catch (error) {
    console.error('[updateMenuAppSupportTitleAction] Помилка оновлення назви пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні назви пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення URL пункту меню підтримки приложения
 */
export async function updateMenuAppSupportUrlAction(
  id: number | string,
  url: string
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

    // Валідація через Zod схему
    const validation = menuUrlSchema.safeParse(url);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний URL пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    // Оновлення в БД
    await updateMenuAppSupportUrl(menuId, validation.data);

    console.log(`[updateMenuAppSupportUrlAction] URL пункту меню ${id} оновлено`);

    // Ревалідуємо сторінку налаштувань меню
    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'URL пункту меню успішно оновлено',
    };
  } catch (error) {
    console.error('[updateMenuAppSupportUrlAction] Помилка оновлення URL пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні URL пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення іконки пункту меню користувача (без секцій)
 */
export async function updateMenuUserItemsIconAction(
  id: number | string,
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

    const validation = menuIconSchema.safeParse(icon);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва іконки',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await updateMenuUserItemsIcon(menuId, validation.data);

    console.log(`[updateMenuUserItemsIconAction] Іконку пункту меню ${id} оновлено`);

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Іконку пункту меню успішно оновлено',
    };
  } catch (error) {
    console.error('[updateMenuUserItemsIconAction] Помилка оновлення іконки пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні іконки пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення іконки пункту меню користувача з секціями
 */
export async function updateMenuUserSectionsItemsIconAction(
  id: number | string,
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

    const validation = menuIconSchema.safeParse(icon);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва іконки',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await updateMenuUserSectionsItemsIcon(menuId, validation.data);

    console.log(`[updateMenuUserSectionsItemsIconAction] Іконку пункту меню ${id} оновлено`);

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Іконку пункту меню успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsItemsIconAction] Помилка оновлення іконки пункту меню:',
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
      message: 'Невідома помилка при оновленні іконки пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення іконки категорії меню користувача з секціями
 */
export async function updateMenuUserSectionsCategoryIconAction(
  id: number | string,
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

    const validation = menuIconSchema.safeParse(icon);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва іконки',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID категорії меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await updateMenuUserSectionsCategoryIcon(menuId, validation.data);

    console.log(`[updateMenuUserSectionsCategoryIconAction] Іконку категорії меню ${id} оновлено`);

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Іконку категорії меню успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updateMenuUserSectionsCategoryIconAction] Помилка оновлення іконки категорії меню:',
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
      message: 'Невідома помилка при оновленні іконки категорії меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення іконки пункту меню підтримки приложения
 */
export async function updateMenuAppSupportIconAction(
  id: number | string,
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

    const validation = menuIconSchema.safeParse(icon);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва іконки',
        code: 'VALIDATION_ERROR',
      };
    }

    // Перевірка типу ID (для меню ID завжди число)
    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await updateMenuAppSupportIcon(menuId, validation.data);

    console.log(`[updateMenuAppSupportIconAction] Іконку пункту меню ${id} оновлено`);

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Іконку пункту меню успішно оновлено',
    };
  } catch (error) {
    console.error('[updateMenuAppSupportIconAction] Помилка оновлення іконки пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні іконки пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення назви пункту загального меню
 */
export async function updateMenuGeneralItemTitleAction(
  id: number | string,
  title: string
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

    const validation = menuTitleSchema.safeParse(title);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return { status: 'error', message: 'Некоректний ID пункту меню', code: 'VALIDATION_ERROR' };
    }

    await updateMenuGeneralItemTitle(menuId, validation.data);

    console.log(`[updateMenuGeneralItemTitleAction] Назву пункту загального меню ${id} оновлено`);

    revalidatePath('/mx-admin/menu-app');
    revalidatePath('/(protected)', 'layout');

    return { status: 'success', message: 'Назву пункту меню успішно оновлено' };
  } catch (error) {
    console.error('[updateMenuGeneralItemTitleAction] Помилка:', error);
    if (error instanceof Error)
      return { status: 'error', message: error.message, code: 'DB_ERROR' };
    return { status: 'error', message: 'Невідома помилка', code: 'UNKNOWN_ERROR' };
  }
}

/**
 * Server Action для оновлення URL пункту загального меню
 */
export async function updateMenuGeneralItemUrlAction(
  id: number | string,
  url: string
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

    const validation = menuUrlSchema.safeParse(url);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний URL пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return { status: 'error', message: 'Некоректний ID пункту меню', code: 'VALIDATION_ERROR' };
    }

    await updateMenuGeneralItemUrl(menuId, validation.data);

    console.log(`[updateMenuGeneralItemUrlAction] URL пункту загального меню ${id} оновлено`);

    revalidatePath('/mx-admin/menu-app');
    revalidatePath('/(protected)', 'layout');

    return { status: 'success', message: 'URL пункту меню успішно оновлено' };
  } catch (error) {
    console.error('[updateMenuGeneralItemUrlAction] Помилка:', error);
    if (error instanceof Error)
      return { status: 'error', message: error.message, code: 'DB_ERROR' };
    return { status: 'error', message: 'Невідома помилка', code: 'UNKNOWN_ERROR' };
  }
}

/**
 * Server Action для оновлення іконки пункту загального меню
 */
export async function updateMenuGeneralItemIconAction(
  id: number | string,
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

    const validation = menuIconSchema.safeParse(icon);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва іконки',
        code: 'VALIDATION_ERROR',
      };
    }

    const menuId = typeof id === 'number' ? id : Number(id);
    if (isNaN(menuId)) {
      return { status: 'error', message: 'Некоректний ID пункту меню', code: 'VALIDATION_ERROR' };
    }

    await updateMenuGeneralItemIcon(menuId, validation.data);

    console.log(`[updateMenuGeneralItemIconAction] Іконку пункту загального меню ${id} оновлено`);

    revalidatePath('/mx-admin/menu-app');

    return { status: 'success', message: 'Іконку пункту меню успішно оновлено' };
  } catch (error) {
    console.error('[updateMenuGeneralItemIconAction] Помилка:', error);
    if (error instanceof Error)
      return { status: 'error', message: error.message, code: 'DB_ERROR' };
    return { status: 'error', message: 'Невідома помилка', code: 'UNKNOWN_ERROR' };
  }
}
