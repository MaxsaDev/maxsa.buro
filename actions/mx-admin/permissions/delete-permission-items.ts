'use server';

import { revalidatePath } from 'next/cache';

import {
  deleteUserPermissionsCategory,
  deleteUserPermissionsItem,
} from '@/data/mx-dic/user-permissions';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для видалення категорії повноважень
 */
export async function deletePermissionCategoryAction(id: number): Promise<ActionStatus> {
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

    await deleteUserPermissionsCategory(id);

    console.log(`[deletePermissionCategoryAction] Категорію повноважень ${id} видалено`);

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: 'Категорію повноважень успішно видалено',
    };
  } catch (error) {
    console.error(
      '[deletePermissionCategoryAction] Помилка видалення категорії повноважень:',
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
      message: 'Невідома помилка при видаленні категорії повноважень',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для видалення пункту повноваження
 */
export async function deletePermissionItemAction(id: number): Promise<ActionStatus> {
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

    await deleteUserPermissionsItem(id);

    console.log(`[deletePermissionItemAction] Пункт повноваження ${id} видалено`);

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: 'Пункт повноваження успішно видалено',
    };
  } catch (error) {
    console.error('[deletePermissionItemAction] Помилка видалення пункту повноваження:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при видаленні пункту повноваження',
      code: 'UNKNOWN_ERROR',
    };
  }
}
