'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';
import { pool } from '@/lib/db';
import { loginSchema } from '@/schemas/auth/schema-auth';

interface LoginState {
  success: boolean;
  message?: string;
  requiresTwoFactor?: boolean; // Флаг що потрібен 2FA
  email?: string; // Email для 2FA flow
  errors?: {
    email?: string[];
    password?: string[];
  };
}

/**
 * Server Action для логіну користувача
 */
export const loginAction = async (
  prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> => {
  try {
    // Отримуємо дані з форми
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    // Валідація через Zod
    const validationResult = loginSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        message: 'Помилка валідації. Перевірте введені дані.',
        errors: {
          email: errors.email,
          password: errors.password,
        },
      };
    }

    const { email, password } = validationResult.data;

    // КРОК 1: Спочатку перевіряємо чи існує користувач та його статус
    const userCheck = await pool.query(
      `SELECT
        u.id,
        u."isBanned",
        u."emailVerified",
        u."twoFactorEnabled",
        a.password as has_password,
        EXISTS(SELECT 1 FROM passkey p WHERE p."userId" = u.id) as has_passkey
       FROM "user" u
       LEFT JOIN account a ON u.id = a."userId" AND a."providerId" = 'credential'
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (userCheck.rows.length === 0) {
      console.log('[Login] ❌ Користувач не знайдений:', email);
      return {
        success: false,
        message: 'Невірний email або пароль',
        errors: {
          email: ['Перевірте правильність email'],
          password: ['Перевірте правильність паролю'],
        },
      };
    }

    const user = userCheck.rows[0];

    // Діагностика
    if (process.env.NODE_ENV === 'development') {
      console.log('[Login] 🔍 User found:', {
        id: user.id,
        email,
        emailVerified: user.emailVerified,
        isBanned: user.isBanned,
        twoFactorEnabled: user.twoFactorEnabled,
        hasPassword: user.has_password ? 'YES' : 'NO',
        hasPasskey: user.has_passkey ? 'YES' : 'NO',
      });
    }

    // Перевірка чи email верифіковано
    if (!user.emailVerified) {
      return {
        success: false,
        message: 'Email не підтверджено. Перевірте вашу пошту.',
      };
    }

    // Перевірка чи користувач заблокований
    if (user.isBanned) {
      return {
        success: false,
        message: 'Ваш акаунт заблокований. Зверніться до адміністрації.',
      };
    }

    // КРОК 2: Якщо 2FA увімкнено - перевіряємо пароль перед поверненням флагу 2FA
    if (user.twoFactorEnabled) {
      // Перевіряємо пароль через Better Auth
      // Якщо пароль невірний - повертаємо помилку
      // Якщо пароль правильний - повертаємо флаг для 2FA flow
      try {
        // Викликаємо signInEmail для перевірки пароля
        // Better Auth з 2FA плагіном поверне помилку про необхідність 2FA коду
        // або помилку про невірний пароль
        await auth.api.signInEmail({
          body: {
            email,
            password,
          },
        });

        // Якщо дійшли сюди без помилки - пароль правильний, але потрібен 2FA
        // Better Auth не створив сесію через 2FA
        return {
          success: false,
          requiresTwoFactor: true,
          email,
          message: 'Введіть код з додатку аутентифікації',
        };
      } catch (authError) {
        // НЕ логуємо NEXT_REDIRECT - це нормальна робота redirect()
        if (authError instanceof Error && authError.message === 'NEXT_REDIRECT') {
          throw authError; // Пробросити redirect далі
        }

        // Перевіряємо чи це помилка про невірний пароль
        const errorMessage = authError instanceof Error ? authError.message : 'Невідома помилка';

        if (
          errorMessage.includes('Invalid') ||
          errorMessage.includes('incorrect') ||
          errorMessage.includes('credentials') ||
          errorMessage.includes('password')
        ) {
          // Невірний пароль
          return {
            success: false,
            message: 'Невірний email або пароль',
            errors: {
              email: ['Перевірте правильність email'],
              password: ['Перевірте правильність паролю'],
            },
          };
        }

        // Якщо помилка пов'язана з 2FA - повертаємо флаг
        if (errorMessage.includes('two-factor') || errorMessage.includes('2FA')) {
          return {
            success: false,
            requiresTwoFactor: true,
            email,
            message: 'Введіть код з додатку аутентифікації',
          };
        }

        // Інші помилки - повертаємо загальну помилку
        if (process.env.NODE_ENV === 'development') {
          console.error('[Login] ❌ 2FA password check failed:', errorMessage);
        }

        return {
          success: false,
          message: 'Невірний email або пароль',
          errors: {
            email: ['Перевірте правильність email'],
            password: ['Перевірте правильність паролю'],
          },
        };
      }
    }

    // КРОК 3: Якщо 2FA НЕ увімкнено - звичайний вхід
    try {
      await auth.api.signInEmail({
        body: {
          email,
          password,
        },
      });

      // Успіх! Логуємо тільки в dev mode
      if (process.env.NODE_ENV === 'development') {
        console.log('[Login] ✅ Успішний вхід для:', email);
      }

      redirect('/dashboard');
    } catch (authError) {
      // НЕ логуємо NEXT_REDIRECT - це нормальна робота redirect()
      if (authError instanceof Error && authError.message === 'NEXT_REDIRECT') {
        throw authError; // Пробросити redirect далі
      }

      // Тільки справжні помилки логуємо
      if (process.env.NODE_ENV === 'development') {
        console.error(
          '[Login] ❌ Auth failed:',
          authError instanceof Error ? authError.message : authError
        );
      }

      // Невірний пароль
      return {
        success: false,
        message: 'Невірний email або пароль',
        errors: {
          email: ['Перевірте правильність email'],
          password: ['Перевірте правильність паролю'],
        },
      };
    }
  } catch (error) {
    // Якщо це redirect - пробросити далі (це не помилка!)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';

    // Обробка специфічних помилок
    if (
      errorMessage.includes('Invalid') ||
      errorMessage.includes('incorrect') ||
      errorMessage.includes('credentials')
    ) {
      return {
        success: false,
        message: 'Невірний email або пароль',
        errors: {
          email: ['Перевірте правильність email'],
          password: ['Перевірте правильність паролю'],
        },
      };
    }

    if (errorMessage.includes('Email not verified') || errorMessage.includes('not verified')) {
      return {
        success: false,
        message: 'Email не підтверджено. Перевірте вашу пошту.',
      };
    }

    if (errorMessage.includes('two-factor')) {
      return {
        success: false,
        message: 'Потрібна двохфакторна аутентифікація',
        requiresTwoFactor: true,
      };
    }

    return {
      success: false,
      message: errorMessage || 'Виникла непередбачена помилка. Спробуйте пізніше.',
    };
  }
};
