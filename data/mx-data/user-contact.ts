import type { UserContact } from '@/interfaces/mx-data/user-contact';
import { pool } from '@/lib/db';

/**
 * Інтерфейс для створення контакту
 */
export interface CreateContactInput {
  userId: string;
  contactTypeId: number;
  contactValue: string;
  isDefault: boolean;
}

/**
 * Отримати всі контакти користувача
 */
export async function getUserContacts(userId: string): Promise<
  (UserContact & {
    contact_type_code: string;
    contact_type_title: string;
    contact_url: string | null;
  })[]
> {
  try {
    const result = await pool.query<
      UserContact & {
        contact_type_code: string;
        contact_type_title: string;
        contact_url: string | null;
      }
    >(
      `SELECT
        uc.id,
        uc.user_id,
        uc.contact_type_id,
        uc.contact_value,
        uc.is_default,
        uc.created_at,
        uc.updated_at,
        dct.code AS contact_type_code,
        dct.title AS contact_type_title,
        mx_data.fn_contact_build_url(dct.code, uc.contact_value) AS contact_url
      FROM mx_data.user_contact uc
      INNER JOIN mx_dic.dic_contact_type dct ON dct.id = uc.contact_type_id
      WHERE uc.user_id = $1
      ORDER BY uc.is_default DESC, uc.created_at ASC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('[getUserContacts] Помилка отримання контактів:', error);
    throw error;
  }
}

/**
 * Створити контакт користувача
 * УВАГА: Використовуйте для одиночних операцій.
 * Для збереження персональних даних + контактів використовуйте savePersonalDataWithContacts з user-data.ts
 */
export async function createUserContact(input: CreateContactInput): Promise<{ id: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query<{ id: string }>(
      `INSERT INTO mx_data.user_contact
       (user_id, contact_type_id, contact_value, is_default)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [input.userId, input.contactTypeId, input.contactValue, input.isDefault]
    );

    if (!result.rows[0]) {
      throw new Error('Не вдалося створити контакт');
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[createUserContact] Помилка створення контакту:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Встановити контакт за замовчуванням
 * BEFORE UPDATE триггер в БД автоматично зніме is_default з інших контактів
 * updated_at встановлюється автоматично через триггер trg_user_contact_bu_set_updated_at
 */
export async function setDefaultContact(userId: string, contactId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE mx_data.user_contact
       SET is_default = true
       WHERE id = $1 AND user_id = $2`,
      [contactId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Контакт не знайдено або не належить користувачу');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[setDefaultContact] Помилка встановлення контакту за замовчуванням:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Видалити контакт користувача
 */
export async function deleteUserContact(userId: string, contactId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `DELETE FROM mx_data.user_contact
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [contactId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Контакт не знайдено або не належить користувачу');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteUserContact] Помилка видалення контакту:', error);
    throw error;
  } finally {
    client.release();
  }
}
