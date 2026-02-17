'use server';

import { auth } from '@/lib/auth/auth';
import { getCurrentUser } from '@/lib/auth/auth-server';

interface ChangePasswordState {
  success: boolean;
  message?: string;
  errors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  };
}

/**
 * Server Action для зміни пароля користувача
 */
export const changePasswordAction = async (
  _prevState: ChangePasswordState | null,
  formData: FormData
): Promise<ChangePasswordState> => {
  try {
    // Перевіряємо чи користувач авторизований
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        message: 'Ви не авторизовані. Увійдіть в систему.',
      };
    }

    // Отримуємо дані з форми
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Валідація
    const errors: ChangePasswordState['errors'] = {};

    if (!currentPassword || currentPassword.length < 1) {
      errors.currentPassword = ['Введіть поточний пароль'];
    }

    // Спочатку перевіряємо базову валідність нового пароля
    const isNewPasswordValid = newPassword && newPassword.length >= 8;

    if (!isNewPasswordValid) {
      errors.newPassword = ['Новий пароль має містити щонайменше 8 символів'];
    }

    // Тільки якщо новий пароль валідний, перевіряємо інші умови
    if (isNewPasswordValid) {
      if (newPassword !== confirmPassword) {
        errors.confirmPassword = ['Паролі не співпадають'];
      }

      if (currentPassword === newPassword) {
        errors.newPassword = ['Новий пароль не може збігатися з поточним'];
      }
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Помилка валідації. Перевірте введені дані.',
        errors,
      };
    }

    // Зміна пароля через Better Auth
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
    });

    console.log('[Change Password] Пароль успішно змінено для користувача:', user.email);

    return {
      success: true,
      message: 'Пароль успішно змінено',
    };
  } catch (error) {
    console.error('[Change Password] Помилка зміни пароля:', error);

    const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';

    // Обробка специфічних помилок
    if (errorMessage.includes('password') || errorMessage.includes('incorrect')) {
      return {
        success: false,
        message: 'Неправильний поточний пароль',
        errors: {
          currentPassword: ['Невірний пароль'],
        },
      };
    }

    return {
      success: false,
      message: 'Помилка при зміні пароля. Спробуйте пізніше.',
    };
  }
};
