/**
 * WebAuthn Client Utilities
 * Допоміжні функції для роботи з WebAuthn в браузері
 *
 * ПРИМІТКА: Registration та Authentication виконуються через офіційний Better Auth API:
 * - authClient.passkey.addPasskey() - для додавання passkey
 * - authClient.signIn.passkey() - для входу через passkey
 *
 * Цей файл містить тільки допоміжні утіліти для UI
 */

// ============================================================
// BROWSER SUPPORT CHECK
// ============================================================

/**
 * Перевіряє чи браузер підтримує WebAuthn
 *
 * @returns true якщо WebAuthn API доступний
 *
 * @example
 * if (!isWebAuthnAvailable()) {
 *   toast.error('Ваш браузер не підтримує Passkey');
 * }
 */
export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/**
 * Перевіряє чи доступний Platform Authenticator
 *
 * Platform Authenticator - це вбудовані засоби автентифікації:
 * - Touch ID / Face ID (macOS, iOS)
 * - Windows Hello (Windows)
 * - Біометрія Android (Android)
 *
 * @returns Promise<boolean> - true якщо platform authenticator доступний
 *
 * @example
 * const hasTouchID = await isPlatformAuthenticatorAvailable();
 * if (hasTouchID) {
 *   console.log('Touch ID / Face ID доступні');
 * }
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnAvailable()) {
    return false;
  }

  try {
    const available =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

// ============================================================
// AUTHENTICATOR UI HELPERS
// ============================================================

/**
 * Отримує emoji іконку для типу authenticator
 *
 * Використовує ОФІЦІЙНИЙ формат Better Auth deviceType:
 * - 'multiDevice' - Touch ID, Face ID, Windows Hello (синхронізовані)
 * - 'singleDevice' - USB Security Keys, NFC (не синхронізовані)
 *
 * @param deviceType - Тип пристрою з Better Auth ('multiDevice' | 'singleDevice' | null)
 * @param backedUp - Чи синхронізовано credential в хмару (iCloud Keychain, Google Password Manager)
 * @returns Emoji іконка
 *
 * @example
 * getAuthenticatorIcon('multiDevice', true)  // '📱' - iPhone з iCloud Keychain
 * getAuthenticatorIcon('multiDevice', false) // '💻' - Mac без синхронізації
 * getAuthenticatorIcon('singleDevice')       // '🔑' - USB Security Key
 */
export function getAuthenticatorIcon(
  deviceType: string | null | undefined,
  backedUp?: boolean
): string {
  // Better Auth: multiDevice = Touch ID, Face ID, Windows Hello
  if (deviceType === 'multiDevice') {
    return backedUp ? '📱' : '💻';
  }

  // Better Auth: singleDevice = USB ключі безпеки, NFC
  if (deviceType === 'singleDevice') {
    return '🔑';
  }

  // Невідомий тип (null або інше значення)
  return '🔐';
}

/**
 * Отримує текстовий опис типу authenticator
 *
 * Використовується для відображення в UI (список passkeys в профілі)
 *
 * @param deviceType - Тип пристрою з Better Auth ('multiDevice' | 'singleDevice' | null)
 * @param backedUp - Чи синхронізовано credential в хмару
 * @returns User-friendly текстовий опис українською
 *
 * @example
 * getAuthenticatorDescription('multiDevice', true)  // 'Пристрій (синхронізовано)'
 * getAuthenticatorDescription('multiDevice', false) // 'Цей пристрій'
 * getAuthenticatorDescription('singleDevice')       // 'Ключ безпеки'
 */
export function getAuthenticatorDescription(
  deviceType: string | null | undefined,
  backedUp?: boolean
): string {
  // Better Auth: multiDevice = Touch ID, Face ID, Windows Hello
  if (deviceType === 'multiDevice') {
    return backedUp ? 'Пристрій (синхронізовано)' : 'Цей пристрій';
  }

  // Better Auth: singleDevice = USB ключі безпеки, NFC
  if (deviceType === 'singleDevice') {
    return 'Ключ безпеки';
  }

  // Невідомий тип
  return 'Невідомий тип';
}

/**
 * BROWSER COMPATIBILITY
 * =====================
 *
 * WebAuthn Level 2 Support:
 * ✅ Chrome/Edge 67+
 * ✅ Safari 13+ (macOS 10.15+)
 * ✅ Firefox 60+
 * ✅ iOS Safari 14.5+ (Touch ID / Face ID)
 * ✅ Android Chrome 70+ (Fingerprint / Face)
 *
 * Platform Authenticators:
 * ✅ macOS: Touch ID, Touch Bar
 * ✅ iOS: Touch ID, Face ID
 * ✅ Windows 10+: Windows Hello (PIN, Face, Fingerprint)
 * ✅ Android 9+: Fingerprint, Face Recognition
 *
 * Cross-platform Authenticators:
 * ✅ YubiKey 5 Series (USB-A, USB-C, NFC, Lightning)
 * ✅ Google Titan Security Key
 * ✅ Feitian ePass FIDO
 * ✅ Thetis FIDO U2F Key
 */
