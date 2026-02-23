'use server';

import { revalidatePath } from 'next/cache';

import { deleteMenuGeneralItem } from '@/data/mx-dic/menu-general';
import {
  deleteMenuAppSupport,
  deleteMenuUserItem,
  deleteMenuUserSectionsCategory,
  deleteMenuUserSectionsItem,
} from '@/data/mx-dic/menu-admin';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для видалення категорії меню користувача з секціями
 */
export async function deleteMenuUserSectionsCategoryAction(id: number): Promise<ActionStatus> {
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

    if (!id || id <= 0) {
      return {
        status: 'error',
        message: 'Некоректний ID категорії меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await deleteMenuUserSectionsCategory(id);

    console.log(`[deleteMenuUserSectionsCategoryAction] Категорію меню ${id} видалено`);

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Категорію меню успішно видалено',
    };
  } catch (error) {
    console.error(
      '[deleteMenuUserSectionsCategoryAction] Помилка видалення категорії меню:',
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
      message: 'Невідома помилка при видаленні категорії меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для видалення пункту меню користувача з секціями
 */
export async function deleteMenuUserSectionsItemAction(id: number): Promise<ActionStatus> {
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

    if (!id || id <= 0) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await deleteMenuUserSectionsItem(id);

    console.log(`[deleteMenuUserSectionsItemAction] Пункт меню ${id} видалено`);

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Пункт меню успішно видалено',
    };
  } catch (error) {
    console.error('[deleteMenuUserSectionsItemAction] Помилка видалення пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при видаленні пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для видалення пункту меню користувача (без секцій)
 */
export async function deleteMenuUserItemAction(id: number): Promise<ActionStatus> {
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

    if (!id || id <= 0) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await deleteMenuUserItem(id);

    console.log(`[deleteMenuUserItemAction] Пункт меню ${id} видалено`);

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Пункт меню успішно видалено',
    };
  } catch (error) {
    console.error('[deleteMenuUserItemAction] Помилка видалення пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при видаленні пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для видалення пункту меню підтримки приложения
 */
export async function deleteMenuAppSupportAction(id: number): Promise<ActionStatus> {
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

    if (!id || id <= 0) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await deleteMenuAppSupport(id);

    console.log(`[deleteMenuAppSupportAction] Пункт меню ${id} видалено`);

    revalidatePath('/mx-admin/menu-app');

    return {
      status: 'success',
      message: 'Пункт меню успішно видалено',
    };
  } catch (error) {
    console.error('[deleteMenuAppSupportAction] Помилка видалення пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при видаленні пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для видалення пункту загального меню
 */
export async function deleteMenuGeneralItemAction(id: number): Promise<ActionStatus> {
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

    if (!id || id <= 0) {
      return {
        status: 'error',
        message: 'Некоректний ID пункту меню',
        code: 'VALIDATION_ERROR',
      };
    }

    await deleteMenuGeneralItem(id);

    console.log(`[deleteMenuGeneralItemAction] Пункт загального меню ${id} видалено`);

    revalidatePath('/mx-admin/menu-app');
    revalidatePath('/(protected)', 'layout');

    return {
      status: 'success',
      message: 'Пункт меню успішно видалено',
    };
  } catch (error) {
    console.error('[deleteMenuGeneralItemAction] Помилка видалення пункту загального меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при видаленні пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}
