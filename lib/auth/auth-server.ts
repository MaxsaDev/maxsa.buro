import { headers } from 'next/headers';

import { auth } from '@/lib/auth/auth';
import type { ExtendedUser } from '@/lib/auth/auth-types';

/**
 * Server-side Authentication Utilities
 *
 * Функції для роботи з автентифікацією в Server Components та Server Actions
 *
 * @see lib/auth-client.ts - для Client Components
 * @see lib/user-context.tsx - для передачі user в Client Components через Context
 */

/**
 * Отримати поточну сесію користувача
 *
 * Використовується в Server Components та Server Actions
 *
 * @returns Session object або null якщо користувач не автентифікований
 *
 * @example
 * ```typescript
 * // Server Component
 * export default async function Page() {
 *   const session = await getSession();
 *   if (!session) return <div>Not authenticated</div>;
 *   return <div>Hello {session.user.name}</div>;
 * }
 * ```
 */
export const getSession = async () => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  return session;
};

/**
 * Отримати поточного користувача
 *
 * Основна функція для отримання користувача в Server Components
 *
 * @returns User object або null якщо користувач не автентифікований
 *
 * @example
 * ```typescript
 * // Server Component
 * export default async function ProfilePage() {
 *   const user = await getCurrentUser();
 *   if (!user) redirect('/login');
 *   return <div>Email: {user.email}</div>;
 * }
 *
 * // Server Action
 * export async function updateProfile() {
 *   'use server';
 *   const user = await getCurrentUser();
 *   if (!user) throw new Error('Not authenticated');
 *   // ... update logic
 * }
 * ```
 *
 * @see lib/user-context.tsx - для використання в Client Components через Context
 */
export const getCurrentUser = async (): Promise<ExtendedUser | null> => {
  const session = await getSession();

  return (session?.user as ExtendedUser) ?? null;
};

/**
 * BEST PRACTICES
 * ===============
 *
 * 1. Server Components (рекомендовано):
 *    ```typescript
 *    const user = await getCurrentUser();
 *    if (!user) redirect('/login');
 *    ```
 *
 * 2. Protected Layout Pattern (наш підхід):
 *    ```typescript
 *    // app/(protected)/layout.tsx
 *    const user = await getCurrentUser();
 *    if (!user) redirect('/login');
 *    return <UserProvider user={user}>{children}</UserProvider>;
 *
 *    // Всі дочірні сторінки гарантовано мають user через Context
 *    ```
 *
 * 3. Client Components:
 *    Використовуйте `useUser()` hook з lib/user-context.tsx
 *    ```typescript
 *    'use client';
 *    import { useUser } from '@/lib/auth/user-context';
 *
 *    function ClientComponent() {
 *      const user = useUser(); // Гарантовано не null в (protected) routes
 *    }
 *    ```
 *
 * 4. Server Actions:
 *    ```typescript
 *    'use server';
 *    export async function myAction() {
 *      const user = await getCurrentUser();
 *      if (!user) return { error: 'Not authenticated' };
 *      // ... business logic
 *    }
 *    ```
 */
