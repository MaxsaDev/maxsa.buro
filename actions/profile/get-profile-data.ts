'use server';

/**
 * Server Actions для отримання даних профілю користувача
 *
 * Використовується для SSR та уникнення client-side fetch запитів
 * Дані завантажуються на сервері та передаються в компоненти
 */

import type { PasskeyDisplay } from '@/interfaces/passkey';
import { getUserFullDataByUserId } from '@/data/mx-data/user-data';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { getUserPasskeysForDisplay } from '@/lib/auth/passkey/passkey';
import type { UserFullData } from '@/data/mx-data/user-data';

/**
 * Інтерфейс даних профілю користувача
 */
export interface ProfileData {
  twoFactorEnabled: boolean;
  passkeys: PasskeyDisplay[];
}

/**
 * Отримує всі дані профілю для відображення на сторінці
 *
 * @returns Об'єкт з даними профілю або null якщо користувач не автентифікований
 *
 * @example
 * ```typescript
 * // Server Component
 * export default async function ProfilePage() {
 *   const profileData = await getProfileData();
 *   if (!profileData) redirect('/login');
 *
 *   return (
 *     <div>
 *       <p>2FA: {profileData.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
 *       <p>Passkeys: {profileData.passkeys.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export async function getProfileData(): Promise<ProfileData | null> {
  try {
    // Отримуємо поточного користувача
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    // Отримуємо список passkeys
    const passkeys = await getUserPasskeysForDisplay(user.id);

    // Повертаємо всі дані профілю
    return {
      twoFactorEnabled: user.twoFactorEnabled || false,
      passkeys,
    };
  } catch (error) {
    console.error('[getProfileData] Error:', error);
    return null;
  }
}

/**
 * Отримує статус 2FA для користувача
 *
 * @returns true якщо 2FA увімкнено, false якщо ні, null якщо помилка
 *
 * @example
 * ```typescript
 * const is2FAEnabled = await getTwoFactorStatus();
 * ```
 */
export async function getTwoFactorStatus(): Promise<boolean | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    return user.twoFactorEnabled || false;
  } catch (error) {
    console.error('[getTwoFactorStatus] Error:', error);
    return null;
  }
}

/**
 * Отримує список passkeys користувача
 *
 * @returns Масив passkeys або порожній масив якщо помилка
 *
 * @example
 * ```typescript
 * const passkeys = await getUserPasskeysList();
 * ```
 */
export async function getUserPasskeysList(): Promise<PasskeyDisplay[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    return await getUserPasskeysForDisplay(user.id);
  } catch (error) {
    console.error('[getUserPasskeysList] Error:', error);
    return [];
  }
}

/**
 * Отримує повні дані поточного користувача (user + user_data + основний контакт)
 *
 * @returns Повні дані користувача або null якщо користувач не автентифікований
 *
 * @example
 * ```typescript
 * const userFullData = await getCurrentUserFullData();
 * ```
 */
export async function getCurrentUserFullData(): Promise<UserFullData | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    return await getUserFullDataByUserId(user.id);
  } catch (error) {
    console.error('[getCurrentUserFullData] Error:', error);
    return null;
  }
}
