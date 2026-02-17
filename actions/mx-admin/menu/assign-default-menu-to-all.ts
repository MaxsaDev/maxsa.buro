'use server';

import { revalidatePath } from 'next/cache';

import { assignDefaultMenuToAllExistingUsers } from '@/lib/auth/assign-default-menu';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';

/**
 * Server Action для призначення меню за замовчуванням всім існуючим користувачам
 *
 * Ця функція корисна, коли адміністратор встановлює нові пункти меню як "за замовчуванням"
 * і хоче призначити їх всім існуючим користувачам, які ще не мають цих пунктів меню.
 */
export async function assignDefaultMenuToAllUsersAction(): Promise<ActionStatus> {
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

    // Призначення меню за замовчуванням всім користувачам
    const result = await assignDefaultMenuToAllExistingUsers(admin.id);

    console.log(
      `[assignDefaultMenuToAllUsersAction] Призначено меню за замовчуванням: ` +
        `${result.usersProcessed} користувачів, ${result.sectionsAssigned} пунктів з секціями, ` +
        `${result.itemsAssigned} пунктів без секцій`
    );

    // Ревалідуємо layout для оновлення меню всіх користувачів
    revalidatePath('/(protected)', 'layout');

    return {
      status: 'success',
      message:
        `Меню за замовчуванням призначено ${result.usersProcessed} користувачам: ` +
        `${result.sectionsAssigned} пунктів з секціями, ${result.itemsAssigned} пунктів без секцій`,
    };
  } catch (error) {
    console.error('[assignDefaultMenuToAllUsersAction] Помилка призначення меню:', error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при призначенні меню за замовчуванням',
      code: 'UNKNOWN_ERROR',
    };
  }
}
