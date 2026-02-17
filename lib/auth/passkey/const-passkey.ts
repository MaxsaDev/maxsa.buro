import { getBaseUrl } from '@/lib/auth/base-url';

const getRpId = () => {
  if (process.env.WEBAUTHN_RP_ID) {
    return process.env.WEBAUTHN_RP_ID;
  }

  try {
    const hostname = new URL(getBaseUrl()).hostname;
    return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  } catch {
    // Безпечний fallback для локальної розробки
    return 'localhost';
  }
};

/**
 * ============================================================
 * WEBAUTHN / PASSKEY CONFIGURATION
 * ============================================================
 *
 * Конфігурація для Passkey (WebAuthn) authentication
 * Використовується в Better Auth Passkey Plugin та lib/passkey.ts
 *
 * WebAuthn - це стандарт W3C для безпарольної автентифікації
 * Дозволяє використовувати:
 * - Platform Authenticators: Touch ID, Face ID, Windows Hello
 * - Cross-platform Authenticators: USB Security Keys (YubiKey), NFC
 * - Synced Credentials: iCloud Keychain, Google Password Manager
 */

/**
 * WebAuthn Relying Party (RP) Configuration
 *
 * Relying Party - це веб-застосунок, який довіряє authenticator'у
 * для верифікації користувача
 */
/**
 * Конфігурація WebAuthn/Passkey для Better Auth.
 */
export const WEBAUTHN_CONFIG = {
  // ========================================
  // БАЗОВІ НАЛАШТУВАННЯ
  // ========================================

  /**
   * RP Name - Назва застосунку
   * Відображається в authenticator (Touch ID prompt, Security Key, тощо)
   *
   * @example "maxsa.com.ua" або "MaxSa App"
   */
  RP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'maxsa.com.ua',

  /**
   * RP ID - Ідентифікатор Relying Party (домен без протоколу та порту)
   *
   * ⚠️ КРИТИЧНО: Має співпадати з доменом, на якому працює застосунок
   *
   * Development: 'localhost'
   * Production:  'maxsa.dev' або 'maxsa.com.ua'
   *
   * ❌ НЕ ВКАЗУЙТЕ протокол (https://) або порт (:3000)
   * ❌ НЕ ВКАЗУЙТЕ піддомен якщо хочете щоб credentials працювали на всіх піддоменах
   */
  RP_ID: getRpId(),

  /**
   * Origin - Повний URL застосунку (з протоколом)
   *
   * Використовується для верифікації, що WebAuthn операція
   * виконується на правильному домені
   *
   * Development: 'http://localhost:3000'
   * Production:  'https://maxsa.com.ua'
   *
   * ⚠️ КРИТИЧНО: Має починатися з https:// в production
   */
  ORIGIN: getBaseUrl(),

  // ========================================
  // НАЛАШТУВАННЯ ТАЙМАУТІВ
  // ========================================

  /**
   * Timeout - Час очікування WebAuthn операції (мілісекунди)
   *
   * Скільки часу користувач має на:
   * - Підтвердження Touch ID / Face ID
   * - Вставку та підтвердження Security Key
   *
   * 60000 = 60 секунд (рекомендовано)
   */
  TIMEOUT: 60000,

  // ========================================
  // НАЛАШТУВАННЯ БЕЗПЕКИ
  // ========================================

  /**
   * User Verification - Вимога верифікації користувача
   *
   * Визначає чи потрібно підтвердження особи (PIN, біометрія):
   *
   * 'required'    - ЗАВЖДИ вимагати (найбезпечніше)
   * 'preferred'   - Рекомендовано, але не обов'язково (за замовчуванням)
   * 'discouraged' - Не рекомендовано (рідко використовується)
   *
   * Рекомендація: 'preferred' - баланс безпеки та UX
   */
  USER_VERIFICATION: 'preferred' as const,

  /**
   * Attestation - Запит на attestation від authenticator
   *
   * Attestation - це криптографічне підтвердження автентичності authenticator'а
   *
   * 'none'     - Не запитувати (рекомендовано, найкраща приватність)
   * 'indirect' - Запитати, але дозволити anonymization
   * 'direct'   - Вимагати повний attestation (рідко потрібно)
   *
   * Рекомендація: 'none' - для більшості застосунків
   * Використовуйте 'direct' тільки якщо потрібно підтвердити конкретну модель пристрою
   */
  ATTESTATION: 'none' as const,

  // ========================================
  // НАЛАШТУВАННЯ ТИПУ AUTHENTICATOR
  // ========================================

  /**
   * Authenticator Attachment - Тип authenticator'а
   *
   * Обмежує які пристрої можна використовувати:
   *
   * 'platform'       - Тільки вбудовані (Touch ID, Face ID, Windows Hello)
   * 'cross-platform' - Тільки зовнішні (USB Security Keys, NFC)
   * undefined        - Будь-які (рекомендовано)
   *
   * Рекомендація: undefined - дати користувачу вибір
   */
  AUTHENTICATOR_ATTACHMENT: undefined as 'platform' | 'cross-platform' | undefined,

  /**
   * Resident Key - Створення discoverable credentials
   *
   * Resident Key (Discoverable Credential) - це credential, який зберігається
   * на authenticator'і та може бути використаний без вказання username
   *
   * 'required'    - ЗАВЖДИ створювати (passwordless login)
   * 'preferred'   - Якщо можливо (рекомендовано)
   * 'discouraged' - Не створювати (старий підхід)
   *
   * Рекомендація: 'preferred' - підтримка passwordless де можливо
   *
   * ℹ️ Якщо 'required' - деякі старі authenticator'и не спрацюють
   */
  RESIDENT_KEY: 'preferred' as const,
} as const;

/**
 * ENVIRONMENT VARIABLES (для production)
 * ======================================
 *
 * .env.local:
 *
 * # App
 * NEXT_PUBLIC_APP_NAME="MaxSa App"
 * NEXT_PUBLIC_APP_URL="https://maxsa.com.ua"
 *
 * # WebAuthn
 * WEBAUTHN_RP_ID="maxsa.com.ua"
 *
 * ⚠️ ВАЖЛИВО:
 * - RP_ID має співпадати з доменом (без https://)
 * - ORIGIN має бути повним URL (з https://)
 * - В development RP_ID='localhost' працює автоматично
 */

/**
 * BROWSER SUPPORT (станом на 2025)
 * =================================
 *
 * ✅ Chrome/Edge 67+
 * ✅ Safari 13+ (macOS 10.15+, iOS 14+)
 * ✅ Firefox 60+
 * ✅ Mobile: iOS 16+, Android 9+
 *
 * Platform Authenticators:
 * ✅ Touch ID (Mac, iPhone, iPad)
 * ✅ Face ID (iPhone, iPad)
 * ✅ Windows Hello (Windows 10+)
 * ✅ Android Biometric (Android 9+)
 *
 * Cross-platform Authenticators:
 * ✅ YubiKey (USB, NFC)
 * ✅ Google Titan Security Key
 * ✅ Feitian ePass FIDO
 */
