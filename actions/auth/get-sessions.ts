'use server';

import { getSessions, type GetSessionsFilters } from '@/data/auth/session-view';
import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';

/**
 * Server Action для отримання списку сесій
 * Доступно тільки для адміністраторів
 */
export const getSessionsAction = async (
  filters?: GetSessionsFilters
): Promise<{ success: boolean; data?: unknown[]; error?: string }> => {
  try {
    // Перевірка авторизації та прав адміністратора
    const currentUser = (await getCurrentUser()) as ExtendedUser | null;

    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Недостатньо прав для виконання цієї дії' };
    }

    const sessions = await getSessions(filters);

    return { success: true, data: sessions };
  } catch (error) {
    console.error('[Action] Помилка отримання списку сесій:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не вдалося отримати список сесій',
    };
  }
};
