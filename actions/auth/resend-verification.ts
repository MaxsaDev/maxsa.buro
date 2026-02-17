'use server';

import { auth } from '@/lib/auth/auth';

interface ResendVerificationState {
  success: boolean;
  message?: string;
  errors?: {
    email?: string[];
  };
}

interface ResendVerificationResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action для повторної відправки email верифікації
 */
export const resendVerificationAction = async (
  _prevState: ResendVerificationState | null,
  formData: FormData
): Promise<ResendVerificationState> => {
  try {
    const email = formData.get('email') as string;

    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Вкажіть коректну електронну адресу',
        errors: {
          email: ['Невірний формат email'],
        },
      };
    }

    console.log('[Resend Verification] Відправка верифікації для:', email);

    // Better Auth має вбудований endpoint для повторної відправки
    await auth.api.sendVerificationEmail({
      body: {
        email,
      },
    });

    console.log('[Resend Verification] Email верифікації успішно відправлено:', email);

    return {
      success: true,
      message: `Лист з підтвердженням відправлено на ${email}. Перевірте свою пошту (включно зі спамом).`,
    };
  } catch (error) {
    console.error('[Resend Verification] Помилка відправки верифікації:', error);

    const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';

    // Обробка специфічних помилок
    if (errorMessage.includes('not found') || errorMessage.includes('User not found')) {
      return {
        success: false,
        message: 'Користувач з таким email не знайдений',
        errors: {
          email: ['Користувач не існує'],
        },
      };
    }

    if (errorMessage.includes('already verified')) {
      return {
        success: false,
        message: 'Email вже підтверджено. Спробуйте увійти в систему.',
      };
    }

    return {
      success: false,
      message: 'Помилка при відправці листа. Спробуйте пізніше або зверніться до підтримки.',
    };
  }
};

/**
 * Функція для повторної відправки верифікаційного email (для адмін-панелі)
 */
export const resendVerification = async (email: string): Promise<ResendVerificationResult> => {
  try {
    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: 'Невірний формат email',
      };
    }

    await auth.api.sendVerificationEmail({
      body: {
        email,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Resend Verification] Помилка відправки верифікації:', error);

    const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';

    if (errorMessage.includes('not found') || errorMessage.includes('User not found')) {
      return {
        success: false,
        error: 'Користувач з таким email не знайдений',
      };
    }

    if (errorMessage.includes('already verified')) {
      return {
        success: false,
        error: 'Email вже підтверджено',
      };
    }

    return {
      success: false,
      error: 'Помилка при відправці листа',
    };
  }
};
