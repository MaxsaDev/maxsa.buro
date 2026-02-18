'use server';

import { revalidatePath } from 'next/cache';

import { bulkDeleteNavUserItems, bulkInsertNavUserItems } from '@/data/mx-system/nav-user-items';
import {
  bulkDeleteNavUserSections,
  bulkInsertNavUserSections,
} from '@/data/mx-system/nav-user-sections';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для масового встановлення або зняття доступу
 * до N пунктів меню для M офісів одночасно
 */
export async function bulkToggleMenuItemsAction(
  userId: string,
  menuIds: number[],
  officeIds: number[],
  isActive: boolean,
  type: 'sections' | 'items'
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

    if (type === 'sections') {
      if (isActive) {
        await bulkInsertNavUserSections(userId, menuIds, officeIds, admin.id);
      } else {
        await bulkDeleteNavUserSections(userId, menuIds, officeIds);
      }
    } else {
      if (isActive) {
        await bulkInsertNavUserItems(userId, menuIds, officeIds, admin.id);
      } else {
        await bulkDeleteNavUserItems(userId, menuIds, officeIds);
      }
    }

    revalidatePath(`/mx-admin/user-data/${userId}`);
    revalidatePath('/(protected)', 'layout');

    return {
      status: 'success',
      message: isActive
        ? `Доступ активовано для ${menuIds.length} пунктів у ${officeIds.length} філіях`
        : `Доступ деактивовано для ${menuIds.length} пунктів у ${officeIds.length} філіях`,
    };
  } catch (error) {
    console.error('[bulkToggleMenuItemsAction] Помилка масової зміни доступу:', error);

    if (error instanceof Error) {
      return { status: 'error', message: error.message, code: 'DB_ERROR' };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при масовій зміні доступу',
      code: 'UNKNOWN_ERROR',
    };
  }
}
