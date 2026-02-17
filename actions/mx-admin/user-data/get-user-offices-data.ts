'use server';

import { getUserOfficesAdminViewByUserId } from '@/data/mx-system/user-offices';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для отримання даних офісів користувача для адміністратора
 */
export async function getUserOfficesDataAction(userId: string) {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      throw new Error('Ви не авторизовані. Увійдіть в систему.');
    }

    if (admin.role !== 'admin') {
      throw new Error('Доступ заборонено. Потрібні права адміністратора.');
    }

    const offices = await getUserOfficesAdminViewByUserId(userId);

    return {
      offices,
    };
  } catch (error) {
    console.error('[getUserOfficesDataAction] Помилка отримання даних офісів:', error);
    throw error;
  }
}
