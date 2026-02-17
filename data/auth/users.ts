'use server';

import { pool } from '@/lib/db';

import type { UserRole } from './types';

/**
 * Отримати роль користувача за ID
 */
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const result = await pool.query<{ role: UserRole }>('SELECT role FROM "user" WHERE id = $1', [
      userId,
    ]);

    return result.rows[0]?.role ?? null;
  } catch (error) {
    console.error('[Data Auth User] Помилка отримання ролі:', error);
    throw new Error('Не вдалося отримати роль користувача');
  }
};

/**
 * Перевірити чи користувач заблокований
 */
export const isUserBanned = async (userId: string): Promise<boolean> => {
  try {
    const result = await pool.query<{ isBanned: boolean }>(
      'SELECT "isBanned" FROM "user" WHERE id = $1',
      [userId]
    );

    return result.rows[0]?.isBanned ?? false;
  } catch (error) {
    console.error('[Data Auth User] Помилка перевірки блокування:', error);
    throw new Error('Не вдалося перевірити статус користувача');
  }
};

/**
 * Змінити роль користувача
 */
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE "user" SET role = $1, "updatedAt" = NOW() WHERE id = $2', [
      newRole,
      userId,
    ]);

    await client.query('COMMIT');
    console.log(`[Data Auth User] Роль користувача ${userId} змінено на ${newRole}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Data Auth User] Помилка зміни ролі:', error);
    throw new Error('Не вдалося змінити роль користувача');
  } finally {
    client.release();
  }
};

/**
 * Заблокувати користувача
 */
export const banUserById = async (userId: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE "user" SET "isBanned" = true, "updatedAt" = NOW() WHERE id = $1', [
      userId,
    ]);

    await client.query('COMMIT');
    console.log(`[Data Auth User] Користувач ${userId} заблокований`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Data Auth User] Помилка блокування:', error);
    throw new Error('Не вдалося заблокувати користувача');
  } finally {
    client.release();
  }
};

/**
 * Розблокувати користувача
 */
export const unbanUserById = async (userId: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE "user" SET "isBanned" = false, "updatedAt" = NOW() WHERE id = $1', [
      userId,
    ]);

    await client.query('COMMIT');
    console.log(`[Data Auth User] Користувач ${userId} розблокований`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Data Auth User] Помилка розблокування:', error);
    throw new Error('Не вдалося розблокувати користувача');
  } finally {
    client.release();
  }
};

/**
 * Отримати користувача за email
 */
export const getUserByEmail = async (email: string) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, "emailVerified", image, role, "isBanned", "createdAt", "updatedAt" FROM "user" WHERE email = $1',
      [email]
    );

    return result.rows[0] ?? null;
  } catch (error) {
    console.error('[Data Auth User] Помилка пошуку користувача:', error);
    throw new Error('Не вдалося знайти користувача');
  }
};

/**
 * Отримати користувача за ID
 */
export const getUserById = async (userId: string) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, "emailVerified", image, role, "isBanned", "twoFactorEnabled", "createdAt", "updatedAt" FROM "user" WHERE id = $1',
      [userId]
    );

    return result.rows[0] ?? null;
  } catch (error) {
    console.error('[Data Auth User] Помилка пошуку користувача:', error);
    throw new Error('Не вдалося знайти користувача');
  }
};

/**
 * Отримати список всіх користувачів (для адмін-панелі)
 */
export const getAllUsers = async () => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, "emailVerified", role, "isBanned", "createdAt" FROM "user" ORDER BY "createdAt" DESC'
    );

    return result.rows;
  } catch (error) {
    console.error('[Data Auth User] Помилка отримання списку користувачів:', error);
    throw new Error('Не вдалося отримати список користувачів');
  }
};
