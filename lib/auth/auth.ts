import { betterAuth } from 'better-auth';
import type { BetterAuthOptions } from 'better-auth';
import { passkey } from '@better-auth/passkey';
import { twoFactor } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';

import { getBaseUrl } from '@/lib/auth/base-url';
import { pool } from '@/lib/db';
import { sendPasswordResetEmail, sendVerificationEmail } from './email';
import { WEBAUTHN_CONFIG } from './passkey/const-passkey';

// Базовий URL застосунку
const BASE_URL = getBaseUrl();

// КРИТИЧНО: Фіксуємо secret ДО ініціалізації
const AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ||
  process.env.AUTH_SECRET ||
  'fallback-secret-key-change-in-production';

// Глобальна змінна для зберігання singleton інстансу
declare global {
  var authInstance: ReturnType<typeof betterAuth> | undefined;
  var authSecret: string | undefined;
}

// Зберігаємо secret глобально (щоб не змінювався між запитами)
if (!global.authSecret) {
  global.authSecret = AUTH_SECRET;
}

// Функція для створення конфігурації Better Auth
const createAuthConfig = (): BetterAuthOptions => ({
  // База даних PostgreSQL - Better Auth 1.x працює напряму з pg Pool
  database: pool,

  // КРИТИЧНО: Secret для підпису JWT токенів, cookies та OAuth state
  // Використовуємо глобальний secret (не змінюється між запитами)
  secret: global.authSecret,

  // Розширення схеми користувача кастомними полями
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'user',
        input: false, // Не дозволяємо встановлювати при реєстрації
      },
      isBanned: {
        type: 'boolean',
        required: true,
        defaultValue: false,
        input: false, // Не дозволяємо встановлювати при реєстрації
      },
    },
  },

  // Базова інформація про застосунок
  appName: 'MaxSa',
  baseURL: BASE_URL,

  // Налаштування сесій
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 днів
    updateAge: 60 * 60 * 24, // Оновлювати кожні 24 години
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 хвилин
    },
  },

  // Налаштування email та пароля
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Обов'язкова верифікація email
    autoSignIn: false, // Не автоматично логінити після реєстрації (спочатку верифікація)
    minPasswordLength: 8,
    maxPasswordLength: 128,

    // Функція відправки email для скидання паролю
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },

  // Налаштування верифікації email
  emailVerification: {
    sendOnSignUp: true, // Автоматично відправляти при реєстрації
    autoSignInAfterVerification: true, // Автоматично логінити після верифікації
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },

  // Налаштування OAuth провайдерів
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Додаткові scope для отримання профілю
      scope: ['email', 'profile'],
      // Явно вказуємо redirect URI
      redirectURI: `${BASE_URL}/api/auth/callback/google`,
    },
  },

  // Плагіни
  plugins: [
    // Passkey (WebAuthn) authentication
    passkey({
      rpName: WEBAUTHN_CONFIG.RP_NAME,
      rpID: WEBAUTHN_CONFIG.RP_ID,
      origin: WEBAUTHN_CONFIG.ORIGIN,
    }),
    // ✅ ОФІЦІЙНИЙ Better Auth 2FA Plugin (TOTP)
    twoFactor({
      issuer: process.env.NEXT_PUBLIC_APP_NAME || 'Maxsa SP',
      // TOTP (Time-based OTP) для Google Authenticator, Authy, тощо
      // Backup codes генеруються автоматично
    }),
    // Next.js cookie handling - МАЄ БУТИ ОСТАННІМ!
    nextCookies(),
  ],

  // Додаткові налаштування безпеки
  advanced: {
    // Використовувати secure cookies тільки в production (важливо для OAuth в dev!)
    useSecureCookies: process.env.NODE_ENV === 'production',
    // Налаштування CSRF захисту
    crossSubDomainCookies: {
      enabled: false,
    },
    // Налаштування бази даних
    database: {
      generateId: undefined, // Використовувати стандартну генерацію
    },
  },
});

// Singleton інстанс Better Auth (для уникнення множинних ініціалізацій)
if (!global.authInstance) {
  global.authInstance = betterAuth(createAuthConfig());
}

/**
 * Серверний інстанс Better Auth.
 */
export const auth = global.authInstance;
