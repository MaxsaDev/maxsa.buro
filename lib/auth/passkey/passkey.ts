/**
 * Passkey (WebAuthn) Helper Functions
 *
 * ⚠️ ВАЖЛИВО: Registration, Authentication та Management
 * виконуються через ОФІЦІЙНИЙ Better Auth Passkey Plugin
 *
 * @see authClient.passkey.addPasskey() - для додавання passkey
 * @see authClient.passkey.listUserPasskeys() - для списку passkeys
 * @see authClient.passkey.deletePasskey() - для видалення
 * @see authClient.passkey.updatePasskey() - для перейменування
 * @see authClient.signIn.passkey() - для входу через passkey
 *
 * Цей файл містить ТІЛЬКИ допоміжні функції для отримання
 * passkeys з БД для SSR та API routes
 */

import { pool } from '@/lib/db';
import type { Passkey, PasskeyDisplay } from '@/interfaces/passkey';

/**
 * Отримує всі passkeys користувача з БД
 *
 * Internal helper function - використовується в getUserPasskeysForDisplay
 *
 * @param userId - ID користувача
 * @returns Масив passkeys з повною інформацією з БД
 *
 * @example
 * ```typescript
 * const passkeys = await getUserPasskeys(user.id);
 * console.log(passkeys[0].credentialID); // Full DB record
 * ```
 */
export async function getUserPasskeys(userId: string): Promise<Passkey[]> {
  const result = await pool.query(
    `SELECT * FROM passkey WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Отримує passkeys для відображення в UI
 *
 * Конвертує БД формат в клієнтський формат для UI
 * Використовується в Server Components та API routes
 *
 * @param userId - ID користувача
 * @returns Масив passkeys у форматі для UI (без sensitive даних)
 *
 * @example
 * ```typescript
 * // Server Component
 * export default async function Page() {
 *   const user = await getCurrentUser();
 *   const passkeys = await getUserPasskeysForDisplay(user.id);
 *   return <PasskeyList passkeys={passkeys} />;
 * }
 *
 * // API Route
 * export async function GET() {
 *   const user = await getCurrentUser();
 *   const passkeys = await getUserPasskeysForDisplay(user.id);
 *   return Response.json({ passkeys });
 * }
 * ```
 *
 * @see app/api/passkey/list/route.ts - приклад використання в API
 * @see app/(protected)/profile/page.tsx - приклад використання в SSR
 */
export async function getUserPasskeysForDisplay(userId: string): Promise<PasskeyDisplay[]> {
  const passkeys = await getUserPasskeys(userId);

  return passkeys.map((passkey) => ({
    id: passkey.id,
    name: passkey.name || 'Без назви',
    // Конвертуємо Better Auth deviceType в UI формат
    deviceType: (passkey.deviceType === 'multiDevice'
      ? 'platform'
      : passkey.deviceType === 'singleDevice'
        ? 'cross-platform'
        : 'unknown') as 'platform' | 'cross-platform' | 'unknown',
    createdAt: passkey.createdAt,
    backedUp: passkey.backedUp,
  }));
}

/**
 * BETTER AUTH PASSKEY API
 * ========================
 *
 * Всі операції з passkeys виконуються через офіційний Better Auth API:
 *
 * 1. Додавання Passkey (Registration):
 *    ```typescript
 *    import { authClient } from '@/lib/auth/auth-client';
 *
 *    await authClient.passkey.addPasskey({
 *      name: 'iPhone 15 Pro',
 *      authenticatorAttachment: 'platform', // або 'cross-platform'
 *    });
 *    ```
 *
 * 2. Вхід через Passkey (Authentication):
 *    ```typescript
 *    await authClient.signIn.passkey();
 *    // Автоматичний редірект після успішного входу
 *    ```
 *
 * 3. Список Passkeys:
 *    ```typescript
 *    const { data, error } = await authClient.passkey.listUserPasskeys();
 *    ```
 *
 * 4. Перейменування Passkey:
 *    ```typescript
 *    await authClient.passkey.updatePasskey({
 *      id: passkeyId,
 *      name: 'New Name',
 *    });
 *    ```
 *
 * 5. Видалення Passkey:
 *    ```typescript
 *    await authClient.passkey.deletePasskey({ id: passkeyId });
 *    ```
 *
 * ПЕРЕВАГИ BETTER AUTH API:
 * - ✅ Автоматична обробка challenge
 * - ✅ Автоматична верифікація
 * - ✅ Вбудована обробка помилок
 * - ✅ Типобезпека TypeScript
 * - ✅ Підтримка всіх браузерів
 * - ✅ Автоматичні редіректи після входу
 */

/**
 * BROWSER SUPPORT
 * ===============
 *
 * WebAuthn Level 2:
 * ✅ Chrome/Edge 67+
 * ✅ Safari 13+ (macOS 10.15+, iOS 14.5+)
 * ✅ Firefox 60+
 * ✅ Mobile: iOS 16+, Android 9+
 *
 * Platform Authenticators:
 * ✅ Touch ID / Face ID (macOS, iOS)
 * ✅ Windows Hello (Windows 10+)
 * ✅ Android Biometric (Android 9+)
 *
 * Cross-platform Authenticators:
 * ✅ YubiKey 5 Series
 * ✅ Google Titan Security Key
 * ✅ Feitian ePass FIDO
 */
