'use server';

/**
 * Admin Utilities (Server Actions)
 *
 * ⚠️ СТАТУС: Заготовка для майбутнього функціоналу
 *
 * Цей файл містить утіліти для адміністрування користувачів.
 * Поки що не використовується - очікує реалізації UI в адмін-панелі.
 *
 * ROADMAP: Priority 2 - Admin Panel
 * - User management (ban/unban, change role)
 * - Analytics dashboard
 * - Audit log
 *
 * TODO: Створити Server Actions для адмін-панелі:
 * - actions/admin/change-role.ts
 * - actions/admin/ban-user.ts
 * - actions/admin/unban-user.ts
 * - actions/admin/delete-user.ts
 */

import type { UserRole } from '@/data/auth/types';
import { banUserById, getUserRole, unbanUserById, updateUserRole } from '@/data/auth/users';

import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Перевірка чи поточний користувач є адміністратором
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;

  const role = await getUserRole(user.id);
  return role === 'admin';
};

/**
 * Змінити роль користувача (тільки для адмінів)
 */
export const changeUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    throw new Error('Тільки адміністратори можуть змінювати ролі');
  }

  await updateUserRole(userId, newRole);
  return true;
};

/**
 * Заблокувати користувача (тільки для адмінів)
 */
export const banUser = async (userId: string, reason?: string): Promise<boolean> => {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    throw new Error('Тільки адміністратори можуть блокувати користувачів');
  }

  await banUserById(userId);
  console.log(`[Auth Admin] Користувач ${userId} заблокований. Причина: ${reason || 'Не вказана'}`);
  return true;
};

/**
 * Розблокувати користувача (тільки для адмінів)
 */
export const unbanUser = async (userId: string): Promise<boolean> => {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    throw new Error('Тільки адміністратори можуть розблоковувати користувачів');
  }

  await unbanUserById(userId);
  return true;
};
