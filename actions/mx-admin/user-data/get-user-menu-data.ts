'use server';

import { getNavUserItemsAdminViewByUserId } from '@/data/mx-system/nav-user-items';
import { getNavUserSectionsAdminViewByUserId } from '@/data/mx-system/nav-user-sections';
import type { NavUserItemsAdminView } from '@/interfaces/mx-system/nav-user-items';
import type { NavUserSectionsAdminView } from '@/interfaces/mx-system/nav-user-sections';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для отримання даних меню користувача для адміністратора
 */
export async function getUserMenuDataAction(userId: string): Promise<{
  sections: NavUserSectionsAdminView[];
  items: NavUserItemsAdminView[];
}> {
  try {
    // Перевірка авторизації
    const admin = await getCurrentUser();

    if (!admin) {
      throw new Error('Ви не авторизовані. Увійдіть в систему.');
    }

    // Перевірка ролі адміністратора
    if (admin.role !== 'admin') {
      throw new Error('Доступ заборонено. Потрібні права адміністратора.');
    }

    // Отримуємо дані меню
    const [sections, items] = await Promise.all([
      getNavUserSectionsAdminViewByUserId(userId),
      getNavUserItemsAdminViewByUserId(userId),
    ]);

    return { sections, items };
  } catch (error) {
    console.error('[getUserMenuDataAction] Помилка отримання даних меню:', error);
    throw error;
  }
}
