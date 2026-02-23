'use server';

import { revalidatePath } from 'next/cache';

import { deleteNavUserGeneral, insertNavUserGeneral } from '@/data/mx-system/nav-user-general';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для активації/деактивації пункту загального меню для користувача
 */
export async function toggleUserGeneralMenuAction(
  userId: string,
  menuItemId: number,
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
      await insertNavUserGeneral(userId, menuItemId, admin.id);
      console.log(
        `[toggleUserGeneralMenuAction] Пункт загального меню ${menuItemId} активовано для користувача ${userId}`
      );
    } else {
      await deleteNavUserGeneral(userId, menuItemId);
      console.log(
        `[toggleUserGeneralMenuAction] Пункт загального меню ${menuItemId} деактивовано для користувача ${userId}`
      );
    }

    revalidatePath(`/mx-admin/user-data/${userId}`);
    revalidatePath('/(protected)', 'layout');

    return {
      status: 'success',
      message: isActive ? 'Пункт меню успішно активовано' : 'Пункт меню успішно деактивовано',
    };
  } catch (error) {
    console.error(
      '[toggleUserGeneralMenuAction] Помилка зміни статусу пункту загального меню:',
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
      message: 'Невідома помилка при зміні статусу пункту загального меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}
