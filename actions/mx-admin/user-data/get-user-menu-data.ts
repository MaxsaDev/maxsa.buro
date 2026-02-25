'use server';

import { getNavUserItemsAdminViewByUserAndOffices } from '@/data/mx-system/nav-user-items';
import { getNavUserSectionsAdminViewByUserAndOffices } from '@/data/mx-system/nav-user-sections';
import type { NavUserItemsAdminView } from '@/interfaces/mx-system/nav-user-items';
import type { NavUserSectionsAdminView } from '@/interfaces/mx-system/nav-user-sections';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для отримання даних меню користувача для адміністратора
 * Фільтрує за списком officeIds — завантажує дані тільки для вибраних офісів
 */
export async function getUserMenuDataAction(
  userId: string,
  officeIds: number[]
): Promise<{
  sections: NavUserSectionsAdminView[];
  items: NavUserItemsAdminView[];
}> {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      throw new Error('Ви не авторизовані. Увійдіть в систему.');
    }

    if (admin.role !== 'admin') {
      throw new Error('Доступ заборонено. Потрібні права адміністратора.');
    }

    if (officeIds.length === 0) {
      return { sections: [], items: [] };
    }

    const [sections, items] = await Promise.all([
      getNavUserSectionsAdminViewByUserAndOffices(userId, officeIds),
      getNavUserItemsAdminViewByUserAndOffices(userId, officeIds),
    ]);

    return { sections, items };
  } catch (error) {
    console.error('[getUserMenuDataAction] Помилка отримання даних меню:', error);
    throw error;
  }
}
