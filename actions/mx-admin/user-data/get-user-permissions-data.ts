'use server';

import { getNavUserPermissionsAdminViewByUserId } from '@/data/mx-system/nav-user-permissions';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для отримання даних повноважень користувача для адміністратора
 */
export async function getUserPermissionsDataAction(userId: string) {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      throw new Error('Ви не авторизовані. Увійдіть в систему.');
    }

    if (admin.role !== 'admin') {
      throw new Error('Доступ заборонено. Потрібні права адміністратора.');
    }

    const permissions = await getNavUserPermissionsAdminViewByUserId(userId);

    return {
      permissions,
    };
  } catch (error) {
    console.error('[getUserPermissionsDataAction] Помилка отримання даних повноважень:', error);
    throw error;
  }
}
