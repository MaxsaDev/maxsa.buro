'use client';

import { createContext, useContext } from 'react';

import type { ExtendedUser } from '@/lib/auth/auth-types';

const UserContext = createContext<ExtendedUser | null>(null);

export function UserProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: ExtendedUser;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/**
 * Hook для отримання поточного користувача в Client Components
 * Користувач гарантовано не null, бо авторизація перевіряється в layout
 */
export function useUser(): ExtendedUser {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error('useUser must be used within UserProvider (protected layout)');
  }
  return user;
}

/**
 * Hook для отримання поточного користувача в Server Components
 * Повертає null, якщо користувач не авторизований
 */
export function useOptionalUser(): ExtendedUser | null {
  return useContext(UserContext);
}
