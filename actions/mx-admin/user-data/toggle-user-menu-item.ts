'use server';

import { revalidatePath } from 'next/cache';

import {
  deleteNavUserItemsByUserId,
  insertNavUserItemsByUserId,
} from '@/data/mx-system/nav-user-items';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для активації/деактивації пункту меню для користувача
 */
export async function toggleUserMenuItemAction(
  userId: string,
  menuId: number,
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
      await insertNavUserItemsByUserId(userId, menuId, admin.id);
      console.log(
        `[toggleUserMenuItemAction] Пункт меню ${menuId} активовано для користувача ${userId}`
      );
    } else {
      // Деактивація: видаляємо запис
      await deleteNavUserItemsByUserId(userId, menuId);
      console.log(
        `[toggleUserMenuItemAction] Пункт меню ${menuId} деактивовано для користувача ${userId}`
      );
    }

    // Ревалідуємо сторінку адмін-панелі та layout для користувача
    revalidatePath(`/mx-admin/user-data/${userId}`);
    revalidatePath('/(protected)', 'layout'); // Оновлюємо layout для оновлення меню користувача

    return {
      status: 'success',
      message: isActive ? 'Пункт меню успішно активовано' : 'Пункт меню успішно деактивовано',
    };
  } catch (error) {
    console.error('[toggleUserMenuItemAction] Помилка зміни статусу пункту меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при зміні статусу пункту меню',
      code: 'UNKNOWN_ERROR',
    };
  }
}
