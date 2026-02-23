'use server';

import { getNavUserGeneralAdminViewByUserId } from '@/data/mx-system/nav-user-general';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для отримання даних загального меню користувача для адміністратора
 */
export async function getUserGeneralMenuDataAction(userId: string) {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      throw new Error('Ви не авторизовані. Увійдіть в систему.');
    }

    if (admin.role !== 'admin') {
      throw new Error('Доступ заборонено. Потрібні права адміністратора.');
    }

    const generalMenuItems = await getNavUserGeneralAdminViewByUserId(userId);

    return {
      generalMenuItems,
    };
  } catch (error) {
    console.error('[getUserGeneralMenuDataAction] Помилка отримання даних загального меню:', error);
    throw error;
  }
}
