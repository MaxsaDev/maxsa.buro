/**
 * Passkey (WebAuthn) TypeScript Interfaces
 *
 * Типи для роботи з Passkey authentication через Better Auth
 */

/**
 * Passkey запис з БД (повний формат)
 *
 * Структура таблиці `passkey` в PostgreSQL
 * Використовується тільки в server-side коді (lib/passkey.ts)
 */
export interface Passkey {
  /** UUID passkey */
  id: string;
  /** Назва для відображення (може бути null) */
  name: string | null;
  /** Public key (base64) */
  publicKey: string;
  /** ID користувача */
  userId: string;
  /** WebAuthn credential ID */
  credentialID: string;
  /** Лічильник для захисту від replay attacks */
  counter: number;
  /** Тип пристрою: 'multiDevice' | 'singleDevice' | null */
  deviceType: string | null;
  /** Чи синхронізовано в хмару (iCloud Keychain, Google Password Manager) */
  backedUp: boolean;
  /** Transports (JSON array: ['internal', 'usb', 'nfc', 'ble']) */
  transports: string | null;
  /** Дата створення */
  createdAt: Date;
}

/**
 * Passkey для відображення в UI
 *
 * Використовується в Client Components для відображення списку passkeys
 * Конвертується з Passkey через getUserPasskeysForDisplay()
 *
 * @see lib/passkey.ts - getUserPasskeysForDisplay()
 * @see components/passkey/passkey-list.tsx - відображення списку
 */
export interface PasskeyDisplay {
  /** UUID passkey */
  id: string;
  /** Назва для відображення */
  name: string;
  /** Тип пристрою для UI: 'platform' | 'cross-platform' | 'unknown' */
  deviceType: 'platform' | 'cross-platform' | 'unknown';
  /** Дата створення */
  createdAt: Date;
  /** Чи синхронізовано в хмару */
  backedUp: boolean;
  /** Дата останнього використання (опційно) */
  lastUsedAt?: Date;
}

/**
 * BETTER AUTH PASSKEY API
 * ========================
 *
 * Всі операції з passkeys виконуються через офіційний Better Auth API:
 *
 * Registration:
 * ```typescript
 * const result = await authClient.passkey.addPasskey({
 *   name: 'iPhone 15 Pro',
 *   authenticatorAttachment: 'platform',
 * });
 * ```
 *
 * Authentication:
 * ```typescript
 * const { error } = await authClient.signIn.passkey();
 * ```
 *
 * List:
 * ```typescript
 * const { data } = await authClient.passkey.listUserPasskeys();
 * ```
 *
 * Update:
 * ```typescript
 * await authClient.passkey.updatePasskey({
 *   id: passkeyId,
 *   name: 'New Name',
 * });
 * ```
 *
 * Delete:
 * ```typescript
 * await authClient.passkey.deletePasskey({ id: passkeyId });
 * ```
 */
