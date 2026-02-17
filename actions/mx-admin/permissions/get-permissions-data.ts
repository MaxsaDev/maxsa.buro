'use server';

import {
  getUserPermissionsCategories,
  getUserPermissionsItems,
} from '@/data/mx-dic/user-permissions';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для отримання всіх категорій та пунктів повноважень
 */
export async function getPermissionsDataAction() {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      throw new Error('Ви не авторизовані. Увійдіть в систему.');
    }

    if (admin.role !== 'admin') {
      throw new Error('Доступ заборонено. Потрібні права адміністратора.');
    }

    const [categories, items] = await Promise.all([
      getUserPermissionsCategories(),
      getUserPermissionsItems(),
    ]);

    return {
      categories,
      items,
    };
  } catch (error) {
    console.error('[getPermissionsDataAction] Помилка отримання даних повноважень:', error);
    throw error;
  }
}
