import { getNavUserPermissionsUserViewByUserId } from '@/data/mx-system/nav-user-permissions';

import type { UserPermission } from '@/store/user-permissions/user-permissions-store';

/**
 * Отримати повноваження користувача для Server Components
 */
export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  try {
    const permissionsData = await getNavUserPermissionsUserViewByUserId(userId);

    return permissionsData.map((p) => ({
      permission_id: p.permission_id,
      permission_title: p.permission_title,
      permission_description: p.permission_description,
      category_id: p.category_id,
      category_title: p.category_title,
    }));
  } catch (error) {
    console.error('[getUserPermissions] Помилка отримання повноважень користувача:', error);
    return [];
  }
}
