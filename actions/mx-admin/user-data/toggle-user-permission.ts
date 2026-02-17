'use server';

import { revalidatePath } from 'next/cache';

import {
  deleteNavUserPermissions,
  insertNavUserPermissionsByUserId,
} from '@/data/mx-system/nav-user-permissions';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для активації/деактивації повноваження для користувача
 */
export async function toggleUserPermissionAction(
  userId: string,
  permissionId: number,
  isActive: boolean
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

    if (isActive) {
      // Активація: додаємо запис
      await insertNavUserPermissionsByUserId(userId, permissionId, admin.id);
      console.log(
        `[toggleUserPermissionAction] Повноваження ${permissionId} активовано для користувача ${userId}`
      );
    } else {
      // Деактивація: видаляємо запис
      await deleteNavUserPermissions(userId, permissionId);
      console.log(
        `[toggleUserPermissionAction] Повноваження ${permissionId} деактивовано для користувача ${userId}`
      );
    }

    // Ревалідуємо сторінку адмін-панелі та layout для користувача
    revalidatePath(`/mx-admin/user-data/${userId}`);
    revalidatePath('/(protected)', 'layout'); // Оновлюємо layout для оновлення повноважень користувача

    return {
      status: 'success',
      message: isActive ? 'Повноваження успішно активовано' : 'Повноваження успішно деактивовано',
    };
  } catch (error) {
    console.error('[toggleUserPermissionAction] Помилка зміни статусу повноваження:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при зміні статусу повноваження',
      code: 'UNKNOWN_ERROR',
    };
  }
}
