# 🚀 Better Auth Setup - Початкове налаштування

> **Повне керівництво по налаштуванню Better Auth 1.3.34+ з Next.js 16**

**Версія:** 2.0.0
**Останнє оновлення:** 10 листопада 2025

---

## 📋 Зміст

1. [Установка пакетів](#установка-пакетів)
2. [Конфігурація Better Auth](#конфігурація-better-auth)
3. [Client-side setup](#client-side-setup)
4. [Server-side utilities](#server-side-utilities)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

---

## 📦 Установка пакетів

```bash
npm install better-auth@^1.3.34
npm install -D @types/node
```

**Додаткові залежності:**

```bash
# PostgreSQL client
npm install pg
npm install -D @types/pg

# Email (Resend)
npm install resend

# Validation
npm install zod

# Forms
npm install react-hook-form @hookform/resolvers
```

---

## 🔧 Конфігурація Better Auth

### Файл: `lib/auth/auth.ts` (Server-side)

```typescript
import { betterAuth } from 'better-auth';
import type { BetterAuthOptions } from 'better-auth';
import { passkey } from 'better-auth/plugins/passkey';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { nextCookies } from 'better-auth/next-js';

import { pool } from './db';
import { sendPasswordResetEmail, sendVerificationEmail } from './email';
import { WEBAUTHN_CONFIG } from './const-passkey';

// Глобальна змінна для authSecret (singleton pattern)
declare global {
  // eslint-disable-next-line no-var
  var authSecret: string | undefined;
}

// Генеруємо секрет ОДИН РАЗ (інакше сесії будуть інвалідуватися при кожному hot reload)
if (!global.authSecret) {
  global.authSecret = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || '';
}

/**
 * Створює конфігурацію Better Auth
 */
const createAuthConfig = (): BetterAuthOptions => ({
  // ========================================
  // DATABASE
  // ========================================
  database: {
    provider: 'postgres',
    createUser: async (user) => {
      const result = await pool.query(
        `INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [user.id, user.name, user.email.toLowerCase(), user.emailVerified, user.image]
      );
      return result.rows[0];
    },
    // Додаткові методи CRUD для user, session, account, verification...
    // (повний код див. в проекті)
  },

  // ========================================
  // SECRET KEY
  // ========================================
  secret: global.authSecret,

  // ========================================
  // APP CONFIG
  // ========================================
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Maxsa SP',
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // ========================================
  // SESSION
  // ========================================
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 днів
    updateAge: 60 * 60 * 24, // Оновлювати кожні 24 години
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 хвилин
    },
  },

  // ========================================
  // EMAIL & PASSWORD AUTH
  // ========================================
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },

  // ========================================
  // EMAIL VERIFICATION
  // ========================================
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: true,
  },

  // ========================================
  // SOCIAL PROVIDERS (OAuth)
  // ========================================
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },

  // ========================================
  // PLUGINS
  // ========================================
  plugins: [
    // Passkey (WebAuthn) authentication
    passkey({
      rpName: WEBAUTHN_CONFIG.RP_NAME,
      rpID: WEBAUTHN_CONFIG.RP_ID,
      origin: WEBAUTHN_CONFIG.ORIGIN,
    }),

    // Two-Factor (TOTP) authentication
    twoFactor({
      issuer: process.env.NEXT_PUBLIC_APP_NAME || 'Maxsa SP',
    }),

    // Next.js cookie handling - МАЄ БУТИ ОСТАННІМ!
    nextCookies(),
  ],

  // ========================================
  // ADVANCED SETTINGS
  // ========================================
  advanced: {
    // Secure cookies тільки в production (важливо для OAuth в dev!)
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});

// ========================================
// SINGLETON INSTANCE
// ========================================
declare global {
  // eslint-disable-next-line no-var
  var authInstance: ReturnType<typeof betterAuth> | undefined;
}

export const auth =
  global.authInstance ||
  (() => {
    const instance = betterAuth(createAuthConfig());
    if (process.env.NODE_ENV === 'development') {
      global.authInstance = instance;
    }
    return instance;
  })();
```

---

## 💻 Client-side setup

### Файл: `lib/auth/auth-client.ts`

```typescript
import { createAuthClient } from 'better-auth/react';
import { passkeyClient, twoFactorClient } from 'better-auth/client/plugins';

/**
 * Клієнтський інстанс Better Auth
 *
 * Plugins:
 * - passkeyClient: WebAuthn passwordless authentication
 * - twoFactorClient: TOTP 2FA support
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [passkeyClient(), twoFactorClient()],
});

// Експортуємо типи для зручності
export type AuthClient = typeof authClient;
```

**Використання в компонентах:**

```typescript
'use client';

import { authClient } from '@/lib/auth/auth-client';

// Login
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
});

// Register
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
});

// Logout
await authClient.signOut();

// Get current session
const { data: session } = await authClient.getSession();
```

---

## 🔐 Server-side utilities

### Файл: `lib/auth/auth-server.ts`

```typescript
'use server';

import { headers } from 'next/headers';

import { auth } from './auth';

/**
 * Отримує поточного авторизованого користувача (Server-side)
 * Використовується в Server Components та Server Actions
 */
export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}

/**
 * Перевіряє чи користувач авторизований (для middleware/guards)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Перевіряє чи користувач має роль адміна
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}
```

**Використання:**

```typescript
// В Server Component
export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <div>Welcome, {user.name}!</div>;
}

// В Server Action
export async function updateProfileAction(data: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // ...
}
```

---

## 🌍 Environment Variables

### Файл: `.env.local`

```bash
# ========================================
# DATABASE
# ========================================
DATABASE_URL="postgresql://user:password@host:5432/database"

# ========================================
# BETTER AUTH
# ========================================
# Секретний ключ для підпису сесій (згенеруйте через: openssl rand -base64 32)
AUTH_SECRET="your-super-secret-key-minimum-32-characters"
BETTER_AUTH_SECRET="your-super-secret-key-minimum-32-characters"

# ========================================
# APP CONFIG
# ========================================
NEXT_PUBLIC_APP_NAME="Maxsa SP"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# В production:
# NEXT_PUBLIC_APP_URL="https://maxsa.dev"

# ========================================
# EMAIL (Resend)
# ========================================
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@maxsa.dev"

# ========================================
# GOOGLE OAUTH (optional)
# ========================================
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ========================================
# WEBAUTHN (Passkey)
# ========================================
# Development
NEXT_PUBLIC_RP_NAME="Maxsa SP"
NEXT_PUBLIC_RP_ID="localhost"
NEXT_PUBLIC_ORIGIN="http://localhost:3000"

# Production
# NEXT_PUBLIC_RP_ID="maxsa.dev"
# NEXT_PUBLIC_ORIGIN="https://maxsa.dev"
```

### Генерація AUTH_SECRET

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🗄 PostgreSQL Setup

### Файл: `lib/db.ts`

```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 60000, // 60 сек
  connectionTimeoutMillis: 10000, // 10 сек
  query_timeout: 30000, // 30 сек
});

// Перевірка підключення
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});
```

---

## 🔑 WebAuthn Config

### Файл: `lib/auth/passkey/const-passkey.ts`

```typescript
/**
 * Конфігурація WebAuthn (Passkey)
 * Детальніша версія доступна в реальному файлі проекту
 */
export const WEBAUTHN_CONFIG = {
  RP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'maxsa.com.ua',
  RP_ID: process.env.WEBAUTHN_RP_ID || 'localhost',
  ORIGIN: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  TIMEOUT: 60000,
  USER_VERIFICATION: 'preferred' as const,
  ATTESTATION: 'none' as const,
  AUTHENTICATOR_ATTACHMENT: undefined as 'platform' | 'cross-platform' | undefined,
  RESIDENT_KEY: 'preferred' as const,
} as const;
```

---

## 📧 Email Setup (Resend)

### Файл: `lib/email.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Відправка email верифікації
 */
export async function sendVerificationEmail(email: string, url: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@maxsa.dev',
    to: email,
    subject: 'Підтвердження email',
    html: `
      <h1>Підтвердіть ваш email</h1>
      <p>Натисніть на посилання нижче для підтвердження:</p>
      <a href="${url}">Підтвердити email</a>
    `,
  });
}

/**
 * Відправка email для скидання паролю
 */
export async function sendPasswordResetEmail(email: string, url: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@maxsa.dev',
    to: email,
    subject: 'Скидання паролю',
    html: `
      <h1>Скидання паролю</h1>
      <p>Натисніть на посилання нижче для скидання паролю:</p>
      <a href="${url}">Скинути пароль</a>
      <p>Посилання дійсне 1 годину.</p>
    `,
  });
}
```

---

## 🐛 Troubleshooting

### Проблема 1: "AUTH_SECRET is not defined"

**Рішення:**

```bash
# Згенеруйте секрет
openssl rand -base64 32

# Додайте в .env.local
AUTH_SECRET="ваш-згенерований-секрет"
BETTER_AUTH_SECRET="ваш-згенерований-секрет"
```

### Проблема 2: Сесія втрачається при hot reload

**Причина:** `authSecret` змінюється при кожному перезапуску

**Рішення:** Використовуйте global singleton (як в прикладі вище)

```typescript
declare global {
  var authSecret: string | undefined;
}

if (!global.authSecret) {
  global.authSecret = process.env.AUTH_SECRET || '';
}
```

### Проблема 3: "Database connection timeout"

**Рішення:** Збільшіть таймаути в `lib/db.ts`:

```typescript
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 секунд
  query_timeout: 30000, // 30 секунд
});
```

### Проблема 4: "nextCookies is not a function"

**Причина:** `nextCookies` має бути останнім плагіном

**Рішення:**

```typescript
plugins: [
  passkey({ ... }),
  twoFactor({ ... }),
  nextCookies(), // ✅ ОСТАННІЙ!
]
```

### Проблема 5: OAuth redirect не працює в dev

**Рішення:** Відключіть `useSecureCookies` в development:

```typescript
advanced: {
  useSecureCookies: process.env.NODE_ENV === 'production',
}
```

---

## ✅ Чек-лист налаштування

- [ ] `better-auth` встановлено
- [ ] `lib/auth/auth.ts` створено
- [ ] `lib/auth/auth-client.ts` створено
- [ ] `lib/auth/auth-server.ts` створено
- [ ] `lib/db.ts` створено
- [ ] `.env.local` налаштовано
- [ ] `AUTH_SECRET` згенеровано
- [ ] `DATABASE_URL` встановлено
- [ ] PostgreSQL працює
- [ ] Resend API key налаштовано
- [ ] Email відправка працює
- [ ] Build проходить (`npm run build`)
- [ ] Linter не показує помилок

---

**Наступний крок:** [Database Schema](./database-schema.md)

---

**Автор:** Max + Cursor AI
**Офіційна документація:** [Better Auth Docs](https://better-auth.com/docs)
