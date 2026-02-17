'use server';

import { revalidatePath } from 'next/cache';

import {
  createUserPermissionsCategory,
  createUserPermissionsItem,
} from '@/data/mx-dic/user-permissions';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import {
  permissionDescriptionSchema,
  permissionIconSchema,
  permissionTitleSchema,
} from '@/schemas/mx-admin/permissions-schema';

/**
 * Server Action для створення нової категорії повноважень
 */
export async function createPermissionCategoryAction(
  title: string,
  description: string | null,
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
    const titleValidation = permissionTitleSchema.safeParse(title);
    const descriptionValidation = permissionDescriptionSchema.safeParse(description);
    const iconValidation = permissionIconSchema.safeParse(icon);

    if (!titleValidation.success) {
      const errors = titleValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва категорії повноважень',
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

    await createUserPermissionsCategory(
      titleValidation.data,
      descriptionValidation.success ? (descriptionValidation.data ?? null) : null,
      iconValidation.data
    );

    console.log('[createPermissionCategoryAction] Категорію повноважень створено');

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: 'Категорію повноважень успішно створено',
    };
  } catch (error) {
    console.error(
      '[createPermissionCategoryAction] Помилка створення категорії повноважень:',
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
      message: 'Невідома помилка при створенні категорії повноважень',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для створення нового пункту повноваження
 */
export async function createPermissionItemAction(
  categoryId: number,
  title: string,
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

    // Валідація через Zod схеми
    const titleValidation = permissionTitleSchema.safeParse(title);
    const descriptionValidation = permissionDescriptionSchema.safeParse(description);

    if (!titleValidation.success) {
      const errors = titleValidation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректна назва пункту повноваження',
        code: 'VALIDATION_ERROR',
      };
    }

    await createUserPermissionsItem(
      categoryId,
      titleValidation.data,
      descriptionValidation.success ? (descriptionValidation.data ?? null) : null
    );

    console.log('[createPermissionItemAction] Пункт повноваження створено');

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: 'Пункт повноваження успішно створено',
    };
  } catch (error) {
    console.error('[createPermissionItemAction] Помилка створення пункту повноваження:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при створенні пункту повноваження',
      code: 'UNKNOWN_ERROR',
    };
  }
}
