import { createAuthClient } from 'better-auth/react';
import { passkeyClient } from '@better-auth/passkey/client';
import { twoFactorClient } from 'better-auth/client/plugins';

import { getBaseUrl } from '@/lib/auth/base-url';

/**
 * Клієнтський інстанс Better Auth
 *
 * Plugins:
 * - passkeyClient: WebAuthn passwordless authentication
 * - twoFactorClient: TOTP 2FA support
 */
/**
 * Клієнтський інстанс Better Auth для браузера.
 */
export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    passkeyClient(),
    twoFactorClient(), // ✅ ОФІЦІЙНИЙ Better Auth 2FA Plugin
  ],
});

// Експортуємо типи для зручності
export type AuthClient = typeof authClient;
