'use server';

import { auth } from '@/lib/auth/auth';

interface ForgotPasswordState {
  success: boolean;
  message?: string;
  errors?: {
    email?: string[];
  };
}

/**
 * Server Action для запиту на скидання паролю
 */
export const forgotPasswordAction = async (
  prevState: ForgotPasswordState | null,
  formData: FormData
): Promise<ForgotPasswordState> => {
  try {
    const email = formData.get('email') as string;

    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Введіть коректний email',
        errors: {
          email: ['Введіть коректний email'],
        },
      };
    }

    // Запит на скидання паролю через Better Auth
    try {
      await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: '/reset-password', // URL для скидання паролю
        },
      });

      console.log('[Forgot Password Action] Лист відправлено на:', email);

      return {
        success: true,
        message: 'Лист з інструкціями відправлено на вашу пошту',
      };
    } catch (authError: unknown) {
      console.error('[Forgot Password Action] Помилка:', authError);

      const errorMessage = authError instanceof Error ? authError.message : 'Невідома помилка';

      return {
        success: false,
        message: errorMessage || 'Помилка при відправці листа. Спробуйте пізніше.',
      };
    }
  } catch (error) {
    console.error('[Forgot Password Action] Критична помилка:', error);

    return {
      success: false,
      message: 'Виникла непередбачена помилка. Спробуйте пізніше.',
    };
  }
};
