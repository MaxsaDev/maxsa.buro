'use server';

import { revalidatePath } from 'next/cache';

import { getUserPermissionsItemsByCategoryId } from '@/data/mx-dic/user-permissions';
import {
  deleteNavUserPermissions,
  insertNavUserPermissionsByUserId,
} from '@/data/mx-system/nav-user-permissions';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для активації/деактивації всієї категорії повноважень для користувача
 */
export async function toggleUserPermissionCategoryAction(
  userId: string,
  categoryId: number,
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

    // Отримуємо всі пункти повноважень цієї категорії
    const items = await getUserPermissionsItemsByCategoryId(categoryId);

    // Активація/деактивація всіх пунктів категорії
    const promises = items.map((item) =>
      isActive
        ? insertNavUserPermissionsByUserId(userId, item.id, admin.id)
        : deleteNavUserPermissions(userId, item.id)
    );

    await Promise.all(promises);

    console.log(
      `[toggleUserPermissionCategoryAction] Категорію повноважень ${categoryId} ${isActive ? 'активовано' : 'деактивовано'} для користувача ${userId}`
    );

    // Ревалідуємо сторінку адмін-панелі та layout для користувача
    revalidatePath(`/mx-admin/user-data/${userId}`);
    revalidatePath('/(protected)', 'layout'); // Оновлюємо layout для оновлення повноважень користувача

    return {
      status: 'success',
      message: isActive
        ? 'Категорію повноважень успішно активовано'
        : 'Категорію повноважень успішно деактивовано',
    };
  } catch (error) {
    console.error(
      '[toggleUserPermissionCategoryAction] Помилка зміни статусу категорії повноважень:',
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
      message: 'Невідома помилка при зміні статусу категорії повноважень',
      code: 'UNKNOWN_ERROR',
    };
  }
}
