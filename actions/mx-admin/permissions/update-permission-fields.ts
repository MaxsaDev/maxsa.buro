'use server';

import { revalidatePath } from 'next/cache';

import {
  updateUserPermissionsCategory,
  updateUserPermissionsItem,
} from '@/data/mx-dic/user-permissions';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import {
  permissionDescriptionSchema,
  permissionIconSchema,
  permissionTitleSchema,
} from '@/schemas/mx-admin/permissions-schema';

/**
 * Server Action для оновлення назви категорії повноважень
 */
export async function updatePermissionCategoryTitleAction(
  id: number,
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

    const validation = permissionTitleSchema.safeParse(title);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва категорії повноважень',
        code: 'VALIDATION_ERROR',
      };
    }

    // Отримуємо поточні дані категорії для оновлення
    const { getUserPermissionsCategories } = await import('@/data/mx-dic/user-permissions');
    const categories = await getUserPermissionsCategories();
    const category = categories.find((c) => c.id === id);

    if (!category) {
      return {
        status: 'error',
        message: 'Категорію повноважень не знайдено',
        code: 'NOT_FOUND',
      };
    }

    await updateUserPermissionsCategory(id, validation.data, category.description, category.icon);

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: 'Назву категорії повноважень успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updatePermissionCategoryTitleAction] Помилка оновлення назви категорії повноважень:',
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
      message: 'Невідома помилка при оновленні назви категорії повноважень',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення опису категорії повноважень
 */
export async function updatePermissionCategoryDescriptionAction(
  id: number,
  description: string | null
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

    const validation = permissionDescriptionSchema.safeParse(description);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний опис категорії повноважень',
        code: 'VALIDATION_ERROR',
      };
    }

    // Отримуємо поточні дані категорії для оновлення
    const { getUserPermissionsCategories } = await import('@/data/mx-dic/user-permissions');
    const categories = await getUserPermissionsCategories();
    const category = categories.find((c) => c.id === id);

    if (!category) {
      return {
        status: 'error',
        message: 'Категорію повноважень не знайдено',
        code: 'NOT_FOUND',
      };
    }

    await updateUserPermissionsCategory(
      id,
      category.title,
      validation.success ? (validation.data ?? null) : null,
      category.icon
    );

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: 'Опис категорії повноважень успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updatePermissionCategoryDescriptionAction] Помилка оновлення опису категорії повноважень:',
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
      message: 'Невідома помилка при оновленні опису категорії повноважень',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення іконки категорії повноважень
 */
export async function updatePermissionCategoryIconAction(
  id: number,
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

    const validation = permissionIconSchema.safeParse(icon);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва іконки',
        code: 'VALIDATION_ERROR',
      };
    }

    // Отримуємо поточні дані категорії для оновлення
    const { getUserPermissionsCategories } = await import('@/data/mx-dic/user-permissions');
    const categories = await getUserPermissionsCategories();
    const category = categories.find((c) => c.id === id);

    if (!category) {
      return {
        status: 'error',
        message: 'Категорію повноважень не знайдено',
        code: 'NOT_FOUND',
      };
    }

    await updateUserPermissionsCategory(id, category.title, category.description, validation.data);

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: 'Іконку категорії повноважень успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updatePermissionCategoryIconAction] Помилка оновлення іконки категорії повноважень:',
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
      message: 'Невідома помилка при оновленні іконки категорії повноважень',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення назви пункту повноваження
 */
export async function updatePermissionItemTitleAction(
  id: number,
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

    const validation = permissionTitleSchema.safeParse(title);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва пункту повноваження',
        code: 'VALIDATION_ERROR',
      };
    }

    // Отримуємо поточні дані пункту для оновлення
    const { getUserPermissionsItems } = await import('@/data/mx-dic/user-permissions');
    const items = await getUserPermissionsItems();
    const item = items.find((i) => i.id === id);

    if (!item) {
      return {
        status: 'error',
        message: 'Пункт повноваження не знайдено',
        code: 'NOT_FOUND',
      };
    }

    await updateUserPermissionsItem(id, validation.data, item.description);

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: 'Назву пункту повноваження успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updatePermissionItemTitleAction] Помилка оновлення назви пункту повноваження:',
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
      message: 'Невідома помилка при оновленні назви пункту повноваження',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для оновлення опису пункту повноваження
 */
export async function updatePermissionItemDescriptionAction(
  id: number,
  description: string | null
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

    const validation = permissionDescriptionSchema.safeParse(description);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректний опис пункту повноваження',
        code: 'VALIDATION_ERROR',
      };
    }

    // Отримуємо поточні дані пункту для оновлення
    const { getUserPermissionsItems } = await import('@/data/mx-dic/user-permissions');
    const items = await getUserPermissionsItems();
    const item = items.find((i) => i.id === id);

    if (!item) {
      return {
        status: 'error',
        message: 'Пункт повноваження не знайдено',
        code: 'NOT_FOUND',
      };
    }

    await updateUserPermissionsItem(
      id,
      item.title,
      validation.success ? (validation.data ?? null) : null
    );

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: 'Опис пункту повноваження успішно оновлено',
    };
  } catch (error) {
    console.error(
      '[updatePermissionItemDescriptionAction] Помилка оновлення опису пункту повноваження:',
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
      message: 'Невідома помилка при оновленні опису пункту повноваження',
      code: 'UNKNOWN_ERROR',
    };
  }
}
