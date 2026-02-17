'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';
import { assignDefaultMenuToUser } from '@/lib/auth/assign-default-menu';
import { getUserByEmail } from '@/data/auth/users';
import { registerSchema } from '@/schemas/auth/schema-auth';

interface RegisterState {
  success: boolean;
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
}

/**
 * Server Action для реєстрації користувача
 */
export const registerAction = async (
  prevState: RegisterState | null,
  formData: FormData
): Promise<RegisterState> => {
  try {
    // Отримуємо дані з форми
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    };

    // Валідація через Zod
    const validationResult = registerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        message: 'Помилка валідації. Перевірте введені дані.',
        errors: {
          email: errors.email,
          password: errors.password,
          confirmPassword: errors.confirmPassword,
        },
      };
    }

    const { email, password } = validationResult.data;

    // Генеруємо унікальне тимчасове ім'я користувача
    const tempName = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    // Реєстрація через Better Auth
    await auth.api.signUpEmail({
      body: {
        name: tempName,
        email,
        password,
      },
    });

    console.log('[Register Action] Користувач успішно зареєстрований:', email);

    // Отримуємо ID нового користувача для призначення меню за замовчуванням
    const newUser = await getUserByEmail(email);
    if (newUser?.id) {
      try {
        await assignDefaultMenuToUser(newUser.id);
        console.log('[Register Action] Меню за замовчуванням призначено користувачу:', newUser.id);
      } catch (error) {
        // Не блокуємо реєстрацію, якщо не вдалося призначити меню
        console.error('[Register Action] Помилка призначення меню за замовчуванням:', error);
      }
    }

    // Редірект на сторінку з повідомленням про верифікацію email
    redirect('/verify-email?email=' + encodeURIComponent(email));
  } catch (error) {
    // Якщо це redirect - пробросити далі (це не помилка!)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    console.error('[Register Action] Помилка реєстрації:', error);

    const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';

    // Обробка специфічних помилок
    if (errorMessage.includes('already exists') || errorMessage.includes('User already exists')) {
      return {
        success: false,
        message: 'Користувач з таким email вже існує',
        errors: {
          email: ['Користувач з таким email вже зареєстрований'],
        },
      };
    }

    return {
      success: false,
      message: errorMessage || 'Виникла непередбачена помилка. Спробуйте пізніше.',
    };
  }
};
