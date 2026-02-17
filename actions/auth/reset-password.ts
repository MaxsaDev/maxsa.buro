'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';

interface ResetPasswordState {
  success: boolean;
  message?: string;
  errors?: {
    password?: string[];
    confirmPassword?: string[];
  };
}

/**
 * Server Action для скидання паролю
 */
export const resetPasswordAction = async (
  token: string,
  prevState: ResetPasswordState | null,
  formData: FormData
): Promise<ResetPasswordState> => {
  try {
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Валідація
    if (!password || password.length < 8) {
      return {
        success: false,
        message: 'Пароль має містити щонайменше 8 символів',
        errors: {
          password: ['Пароль має містити щонайменше 8 символів'],
        },
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        message: 'Паролі не співпадають',
        errors: {
          confirmPassword: ['Паролі не співпадають'],
        },
      };
    }

    // Скидання паролю через Better Auth
    try {
      await auth.api.resetPassword({
        body: {
          newPassword: password,
          token,
        },
      });

      // Успіх! Логуємо тільки в dev mode
      if (process.env.NODE_ENV === 'development') {
        console.log('[Reset Password] ✅ Пароль успішно змінено');
      }

      // Редірект на сторінку логіну з повідомленням про успіх
      redirect('/login?reset=success');
    } catch (resetError) {
      // НЕ логуємо NEXT_REDIRECT - це нормальна робота redirect()
      if (resetError instanceof Error && resetError.message === 'NEXT_REDIRECT') {
        throw resetError; // Пробросити redirect далі
      }

      // Тільки справжні помилки логуємо
      if (process.env.NODE_ENV === 'development') {
        console.error(
          '[Reset Password] ❌ Failed:',
          resetError instanceof Error ? resetError.message : resetError
        );
      }

      throw resetError; // Пробросити далі для обробки в зовнішньому catch
    }
  } catch (error) {
    // Якщо це redirect - пробросити далі (це не помилка!)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    console.error('[Reset Password Action] Помилка:', error);

    const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';

    if (
      errorMessage.includes('Invalid token') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('invalid')
    ) {
      return {
        success: false,
        message: 'Посилання недійсне або застаріле. Запитайте нове посилання.',
      };
    }

    return {
      success: false,
      message: errorMessage || 'Виникла непередбачена помилка. Спробуйте пізніше.',
    };
  }
};
