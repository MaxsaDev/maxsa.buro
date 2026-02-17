'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';

/**
 * Server Action для виходу користувача з системи
 * Повертає never, бо завжди завершується redirect()
 */
export const logoutAction = async (): Promise<never> => {
  const cookieStore = await cookies();

  try {
    // Спочатку викликаємо Better Auth API для видалення сесії на сервері
    // Передаємо cookie в заголовках, щоб сервер міг інвалідувати сесію
    await auth.api.signOut({
      headers: {
        // Передаємо cookie в заголовках (включаючи session token)
        cookie: cookieStore
          .getAll()
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join('; '),
      },
    });
  } catch (error) {
    // Якщо це NEXT_REDIRECT - пробросити далі
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    // Інші помилки логуємо, але продовжуємо
    console.error('[Logout Action] Помилка виходу:', error);
  }

  // Після успішного видалення сесії на сервері видаляємо cookie на клієнті
  cookieStore.delete('better-auth.session_token');

  // Перенаправляємо на головну сторінку
  redirect('/');
};
