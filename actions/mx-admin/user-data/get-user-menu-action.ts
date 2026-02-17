'use server';

import { buildUserMenu } from '@/lib/menu/build-user-menu';
import { getCurrentUser } from '@/lib/auth/auth-server';
import type { MenuItem, MenuSection } from '@/lib/menu/types';

/**
 * Server Action для отримання меню користувача
 * Використовується для оновлення меню після змін в адмін-панелі
 */
export async function getUserMenuAction(userId: string): Promise<{
  sections: MenuSection[];
  items: MenuItem[];
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

    // Отримуємо меню користувача
    const userMenu = await buildUserMenu(userId);

    return {
      sections: userMenu.sections.map((section) => ({
        ...section,
        isActive: section.isActive ?? true,
        items: section.items ?? [],
      })),
      items: userMenu.items,
    };
  } catch (error) {
    console.error('[getUserMenuAction] Помилка отримання меню користувача:', error);
    throw error;
  }
}
