'use server';

import { getCurrentUser } from '@/lib/auth/auth-server';
import type { UserData } from '@/interfaces/mx-data/user-data';
import type { UserContact } from '@/interfaces/mx-data/user-contact';
import { getUserDataByUserId } from '@/data/mx-data/user-data';
import { getUserContacts } from '@/data/mx-data/user-contact';

/**
 * Інтерфейс відповіді з персональними даними
 */
export interface PersonalDataResponse {
  userData: UserData | null;
  contacts: (UserContact & { contact_type_code: string; contact_type_title: string })[];
  hasData: boolean;
}

/**
 * Server Action для отримання персональних даних користувача
 */
export async function getPersonalDataAction(): Promise<PersonalDataResponse> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Користувач не авторизований');
    }

    // Отримати персональні дані
    const userData = await getUserDataByUserId(user.id);

    // Якщо немає персональних даних - повертаємо порожній результат
    if (!userData) {
      return {
        userData: null,
        contacts: [],
        hasData: false,
      };
    }

    // Отримати контакти користувача
    const contacts = await getUserContacts(user.id);

    return {
      userData,
      contacts,
      hasData: true,
    };
  } catch (error) {
    console.error('[getPersonalDataAction] Помилка отримання персональних даних:', error);
    throw error;
  }
}
