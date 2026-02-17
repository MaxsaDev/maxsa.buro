'use server';

import { revalidatePath } from 'next/cache';

import {
  toggleUserPermissionsCategoryActive,
  toggleUserPermissionsItemActive,
} from '@/data/mx-dic/user-permissions';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для переключення активності категорії повноважень
 */
export async function togglePermissionCategoryActiveAction(
  id: number,
  isActive: boolean
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

    await toggleUserPermissionsCategoryActive(id, isActive);

    console.log(
      `[togglePermissionCategoryActiveAction] Категорія повноважень ${id} ${isActive ? 'активовано' : 'деактивовано'}`
    );

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: `Категорія повноважень ${isActive ? 'активовано' : 'деактивовано'}`,
    };
  } catch (error) {
    console.error('[togglePermissionCategoryActiveAction] Помилка переключення активності:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при переключенні активності категорії повноважень',
      code: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Server Action для переключення активності пункту повноваження
 */
export async function togglePermissionItemActiveAction(
  id: number,
  isActive: boolean
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

    await toggleUserPermissionsItemActive(id, isActive);

    console.log(
      `[togglePermissionItemActiveAction] Пункт повноваження ${id} ${isActive ? 'активовано' : 'деактивовано'}`
    );

    revalidatePath('/mx-admin/permissions');

    return {
      status: 'success',
      message: `Пункт повноваження ${isActive ? 'активовано' : 'деактивовано'}`,
    };
  } catch (error) {
    console.error('[togglePermissionItemActiveAction] Помилка переключення активності:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при переключенні активності пункту повноваження',
      code: 'UNKNOWN_ERROR',
    };
  }
}
