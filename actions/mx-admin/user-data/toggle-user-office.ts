'use server';

import { revalidatePath } from 'next/cache';

import { deleteUserOffice, insertUserOffice } from '@/data/mx-system/user-offices';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для активації/деактивації офісу для користувача
 */
export async function toggleUserOfficeAction(
  userId: string,
  officeId: number,
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
      await insertUserOffice(userId, officeId, admin.id);
      console.log(`[toggleUserOfficeAction] Офіс ${officeId} призначено користувачу ${userId}`);
    } else {
      // Деактивація: видаляємо запис
      await deleteUserOffice(userId, officeId);
      console.log(`[toggleUserOfficeAction] Офіс ${officeId} відкликано у користувача ${userId}`);
    }

    // Ревалідуємо сторінку адмін-панелі та layout для користувача
    revalidatePath(`/mx-admin/user-data/${userId}`);
    revalidatePath('/(protected)', 'layout');

    return {
      status: 'success',
      message: isActive ? 'Офіс успішно призначено' : 'Офіс успішно відкликано',
    };
  } catch (error) {
    console.error('[toggleUserOfficeAction] Помилка зміни статусу офісу:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при зміні статусу офісу',
      code: 'UNKNOWN_ERROR',
    };
  }
}
