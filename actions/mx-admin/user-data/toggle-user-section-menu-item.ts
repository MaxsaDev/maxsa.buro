'use server';

import { revalidatePath } from 'next/cache';

import {
  deleteNavUserSectionsByUserAndOffice,
  insertNavUserSectionsByUserAndOffice,
} from '@/data/mx-system/nav-user-sections';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для активації/деактивації пункту меню з секціями для користувача в конкретному офісі
 */
export async function toggleUserSectionMenuItemAction(
  userId: string,
  menuId: number,
  officeId: number,
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

    if (isActive) {
      await insertNavUserSectionsByUserAndOffice(userId, menuId, officeId, admin.id);
    } else {
      await deleteNavUserSectionsByUserAndOffice(userId, menuId, officeId);
    }

    revalidatePath(`/mx-admin/user-data/${userId}`);
    revalidatePath('/(protected)', 'layout');

    return {
      status: 'success',
      message: isActive ? 'Пункт меню успішно активовано' : 'Пункт меню успішно деактивовано',
    };
  } catch (error) {
    console.error('[toggleUserSectionMenuItemAction] Помилка зміни статусу пункту меню:', error);

    if (error instanceof Error) {
      return { status: 'error', message: error.message, code: 'DB_ERROR' };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при зміні статусу пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}
