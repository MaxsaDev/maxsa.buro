/**
 * Типи для auth схеми бази даних
 */

// Ролі користувачів
export type UserRole = 'user' | 'admin';

// User з бази даних
export interface Users {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  image?: string | null;
  role: UserRole;
  is_banned: boolean;
  created_at: Date;
  updated_at: Date;
}

// Session з бази даних
export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Константи ролей
export const USER_ROLES = {
  USER: 'user' as const,
  ADMIN: 'admin' as const,
} as const;
