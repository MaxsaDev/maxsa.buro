import type { UserData, UserDataWithContactView } from '@/interfaces/mx-data/user-data';
import { pool } from '@/lib/db';

/**
 * Інтерфейс для збереження контакту
 */
export interface SaveContactData {
  userId: string;
  contactTypeId: number;
  contactValue: string;
  isDefault: boolean;
}

/**
 * Отримати всі персональні дані користувачів
 */
export async function getUserDataWithContactView(): Promise<UserDataWithContactView[]> {
  try {
    const sql = 'SELECT * FROM mx_data.user_data_with_contact_view ORDER BY created_at DESC';
    const result = await pool.query<UserDataWithContactView>(sql);

    return result.rows;
  } catch (error) {
    console.error('[getUserData] Помилка отримання персональних даних користувачів:', error);
    throw error;
  }
}

/**
 * Отримати персональні дані користувача за user_id
 */
export async function getUserDataByUserId(userId: string): Promise<UserData | null> {
  try {
    const sql = `
      SELECT
        id,
        user_id,
        full_name,
        created_at,
        updated_at
      FROM mx_data.user_data
      WHERE user_id = $1
      LIMIT 1`;

    const params = [userId];
    const result = await pool.query<UserData>(sql, params);

    return result.rows[0] || null;
  } catch (error) {
    console.error('[getUserDataByUserId] Помилка отримання персональних даних:', error);
    throw error;
  }
}

/**
 * Отримати повні дані користувача (user + user_data + основний контакт) за user_id
 * Використовується для адмін-панелі для перегляду даних користувача
 */
export interface UserFullData {
  // Дані з таблиці user
  id: string;
  name: string;
  email: string;
  emailVerified: Date | null;
  role: string | null;
  createdAt: Date;
  // Дані з таблиці user_data
  user_data_id: string | null;
  full_name: string | null;
  user_data_updated_at: Date | null;
  // Дані основного контакту
  default_contact_value: string | null;
  default_contact_type_code: string | null;
  default_contact_type_title: string | null;
  default_contact_url: string | null;
}

export async function getUserFullDataByUserId(userId: string): Promise<UserFullData | null> {
  try {
    const sql = `
      SELECT
        u.id,
        u.name,
        u.email,
        u."emailVerified" AS "emailVerified",
        u.role,
        u."createdAt" AS "createdAt",
        ud.id AS user_data_id,
        ud.full_name,
        ud.updated_at AS user_data_updated_at,
        uc.contact_value AS default_contact_value,
        dct.code AS default_contact_type_code,
        dct.title AS default_contact_type_title,
        mx_data.fn_contact_build_url(dct.code, uc.contact_value) AS default_contact_url
      FROM public."user" u
      LEFT JOIN mx_data.user_data ud ON ud.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT c.contact_value, c.contact_type_id
        FROM mx_data.user_contact c
        WHERE c.user_id = u.id AND c.is_default = true
        LIMIT 1
      ) uc ON TRUE
      LEFT JOIN mx_dic.dic_contact_type dct ON dct.id = uc.contact_type_id
      WHERE u.id = $1
      LIMIT 1`;

    const params = [userId];
    const result = await pool.query<UserFullData>(sql, params);

    return result.rows[0] || null;
  } catch (error) {
    console.error('[getUserFullDataByUserId] Помилка отримання повних даних користувача:', error);
    throw error;
  }
}

/**
 * Створити персональні дані користувача
 */
export async function createUserData(userId: string, fullName: string): Promise<{ id: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query<{ id: string }>(
      `INSERT INTO mx_data.user_data (user_id, full_name)
       VALUES ($1, $2)
       RETURNING id`,
      [userId, fullName]
    );

    if (!result.rows[0]) {
      throw new Error('Не вдалося створити запис персональних даних');
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[createUserData] Помилка створення персональних даних:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Перевірити чи існують персональні дані користувача
 */
export async function userDataExists(userId: string): Promise<boolean> {
  try {
    const result = await pool.query(`SELECT 1 FROM mx_data.user_data WHERE user_id = $1 LIMIT 1`, [
      userId,
    ]);

    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('[userDataExists] Помилка перевірки існування персональних даних:', error);
    throw error;
  }
}

/**
 * Оновити повне імʼя користувача
 * updated_at встановлюється автоматично через триггер trg_user_data_bu_set_updated_at
 */
export async function updateUserDataFullName(userId: string, fullName: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE mx_data.user_data
       SET full_name = $1
       WHERE user_id = $2`,
      [fullName, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Персональні дані користувача не знайдено');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[updateUserDataFullName] Помилка оновлення повного імені:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Видалити "осиротілі" контакти користувача (без user_data)
 */
export async function deleteOrphanedContacts(userId: string): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `DELETE FROM mx_data.user_contact
       WHERE user_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM mx_data.user_data WHERE user_id = $1
       )
       RETURNING id`,
      [userId]
    );

    await client.query('COMMIT');
    return result.rowCount || 0;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteOrphanedContacts] Помилка видалення осиротілих контактів:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Атомарно зберегти персональні дані користувача разом з контактами
 * Вся операція виконується в одній транзакції: або все успішно, або відкат
 */
export async function savePersonalDataWithContacts(
  userId: string,
  fullName: string,
  contacts: SaveContactData[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Створення персональних даних
    const userDataResult = await client.query(
      `INSERT INTO mx_data.user_data (user_id, full_name)
       VALUES ($1, $2)
       RETURNING id`,
      [userId, fullName]
    );

    if (!userDataResult.rows[0]) {
      throw new Error('Не вдалося створити запис персональних даних');
    }

    // 2. Вставка контактів ПОСЛІДОВНО (щоб уникнути race condition з is_default)
    for (const contact of contacts) {
      const contactResult = await client.query(
        `INSERT INTO mx_data.user_contact
         (user_id, contact_type_id, contact_value, is_default)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [contact.userId, contact.contactTypeId, contact.contactValue, contact.isDefault]
      );

      if (!contactResult.rows[0]) {
        throw new Error('Не вдалося створити контакт');
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[savePersonalDataWithContacts] Помилка збереження персональних даних:', error);
    throw error;
  } finally {
    client.release();
  }
}
