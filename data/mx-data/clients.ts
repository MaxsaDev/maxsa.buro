import type {
  ClientLegal,
  ClientView,
  DuplicateContactResult,
} from '@/interfaces/mx-data/client-view';
import { pool } from '@/lib/db';

/**
 * Фільтр для списку клієнтів
 */
export type ClientFilter = 'all' | 'natural' | 'legal';

/**
 * Дані для збереження контакту клієнта
 */
export interface ClientContactData {
  contactTypeId: number;
  contactValue: string;
  isDefault: boolean;
}

/**
 * Дані для збереження нового клієнта
 */
export interface CreateClientData {
  fullName: string;
  contacts: ClientContactData[];
  legal?: {
    data_edrpou: string;
    data_address?: string;
    data_address_legal?: string;
    phone?: string;
    email?: string;
    tin?: string;
    data_account?: string;
    data_bank?: string;
    mfo_bank?: string;
    post_director?: string;
    data_director?: string;
    phone_director?: string;
    data_accountant?: string;
    phone_accountant?: string;
    data_contact?: string;
    phone_contact?: string;
    description?: string;
  };
}

/**
 * Отримати список клієнтів з фільтрацією
 */
export async function getClients(filter: ClientFilter = 'all'): Promise<ClientView[]> {
  try {
    let whereClause = '';
    if (filter === 'legal') {
      whereClause =
        'WHERE EXISTS (SELECT 1 FROM mx_data.user_data_legal l WHERE l.user_data_id = ud.id)';
    } else if (filter === 'natural') {
      whereClause =
        'WHERE NOT EXISTS (SELECT 1 FROM mx_data.user_data_legal l WHERE l.user_data_id = ud.id)';
    }

    const sql = `
      SELECT
        ud.id               AS user_data_id,
        ud.user_id,
        u.name              AS user_name,
        u.image             AS user_image,
        ud.full_name,
        ud.created_at,
        ud.updated_at,
        uc.contact_value,
        dct.code            AS contact_type_code,
        uc.contact_type_id,
        mx_data.fn_contact_build_url(dct.code, uc.contact_value) AS contact_url,
        EXISTS (
          SELECT 1 FROM mx_data.user_data_legal l WHERE l.user_data_id = ud.id
        ) AS has_legal
      FROM mx_data.user_data ud
      LEFT JOIN LATERAL (
        SELECT c.contact_value, c.contact_type_id
        FROM mx_data.user_contact c
        WHERE (ud.user_id IS NOT NULL AND c.user_id = ud.user_id)
           OR (ud.user_id IS NULL AND c.user_data_id = ud.id)
        ORDER BY c.is_default DESC, c.updated_at DESC
        LIMIT 1
      ) uc ON TRUE
      LEFT JOIN mx_dic.dic_contact_type dct ON dct.id = uc.contact_type_id
      LEFT JOIN public."user" u ON u.id = ud.user_id
      ${whereClause}
      ORDER BY ud.created_at DESC
    `;

    const result = await pool.query<ClientView>(sql);
    return result.rows;
  } catch (error) {
    console.error('[getClients] Помилка отримання списку клієнтів:', error);
    throw error;
  }
}

/**
 * Перевірка дублікату контакту в базі
 * Перевіряє за contact_value незалежно від типу власника
 */
export async function checkDuplicateContact(
  contactValue: string,
  contactTypeId: number
): Promise<DuplicateContactResult> {
  try {
    const sql = `
      SELECT
        ud.full_name,
        uc.contact_value,
        dct.code AS contact_type_code
      FROM mx_data.user_contact uc
      JOIN mx_data.user_data ud ON (
        (uc.user_id IS NOT NULL AND ud.user_id = uc.user_id)
        OR (uc.user_data_id IS NOT NULL AND ud.id = uc.user_data_id)
      )
      JOIN mx_dic.dic_contact_type dct ON dct.id = uc.contact_type_id
      WHERE uc.contact_value = $1
        AND uc.contact_type_id = $2
      LIMIT 1
    `;

    const result = await pool.query<{
      full_name: string;
      contact_value: string;
      contact_type_code: string;
    }>(sql, [contactValue, contactTypeId]);

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        exists: true,
        full_name: row.full_name,
        contact_value: row.contact_value,
        contact_type_code: row.contact_type_code,
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('[checkDuplicateContact] Помилка перевірки дублікату контакту:', error);
    throw error;
  }
}

/**
 * Атомарно зберегти нового клієнта з контактами та опційними юридичними даними
 */
export async function createClientWithContacts(
  data: CreateClientData
): Promise<{ user_data_id: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Створюємо запис профілю без user_id (клієнт без акаунту)
    const userDataResult = await client.query<{ id: string }>(
      `INSERT INTO mx_data.user_data (user_id, full_name)
       VALUES (NULL, $1)
       RETURNING id`,
      [data.fullName]
    );

    const userDataId = userDataResult.rows[0]?.id;
    if (!userDataId) {
      throw new Error('Не вдалося створити запис клієнта');
    }

    // 2. Вставляємо контакти ПОСЛІДОВНО (щоб уникнути race condition з is_default)
    for (const contact of data.contacts) {
      const contactResult = await client.query(
        `INSERT INTO mx_data.user_contact
         (user_id, user_data_id, contact_type_id, contact_value, is_default)
         VALUES (NULL, $1, $2, $3, $4)
         RETURNING id`,
        [userDataId, contact.contactTypeId, contact.contactValue, contact.isDefault]
      );

      if (!contactResult.rows[0]) {
        throw new Error('Не вдалося створити контакт клієнта');
      }
    }

    // 3. Якщо передані юридичні дані — зберігаємо
    if (data.legal) {
      const legalResult = await client.query(
        `INSERT INTO mx_data.user_data_legal (
          user_data_id, data_edrpou, data_address, data_address_legal,
          phone, email, tin, data_account, data_bank, mfo_bank,
          post_director, data_director, phone_director,
          data_accountant, phone_accountant,
          data_contact, phone_contact, description
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING id`,
        [
          userDataId,
          data.legal.data_edrpou,
          data.legal.data_address || null,
          data.legal.data_address_legal || null,
          data.legal.phone || null,
          data.legal.email || null,
          data.legal.tin || null,
          data.legal.data_account || null,
          data.legal.data_bank || null,
          data.legal.mfo_bank || null,
          data.legal.post_director || null,
          data.legal.data_director || null,
          data.legal.phone_director || null,
          data.legal.data_accountant || null,
          data.legal.phone_accountant || null,
          data.legal.data_contact || null,
          data.legal.phone_contact || null,
          data.legal.description || null,
        ]
      );

      if (!legalResult.rows[0]) {
        throw new Error('Не вдалося зберегти юридичні дані клієнта');
      }
    }

    await client.query('COMMIT');
    return { user_data_id: userDataId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[createClientWithContacts] Помилка створення клієнта:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Отримати юридичні дані клієнта за user_data_id
 */
export async function getClientLegal(userDataId: string): Promise<ClientLegal | null> {
  try {
    const sql = `
      SELECT * FROM mx_data.user_data_legal
      WHERE user_data_id = $1
      LIMIT 1
    `;
    const result = await pool.query<ClientLegal>(sql, [userDataId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[getClientLegal] Помилка отримання юридичних даних:', error);
    throw error;
  }
}

/**
 * Отримати клієнта за user_data_id
 */
export async function getClientById(userDataId: string): Promise<ClientView | null> {
  try {
    const sql = `
      SELECT
        ud.id               AS user_data_id,
        ud.user_id,
        u.name              AS user_name,
        u.image             AS user_image,
        ud.full_name,
        ud.created_at,
        ud.updated_at,
        uc.contact_value,
        dct.code            AS contact_type_code,
        uc.contact_type_id,
        mx_data.fn_contact_build_url(dct.code, uc.contact_value) AS contact_url,
        EXISTS (
          SELECT 1 FROM mx_data.user_data_legal l WHERE l.user_data_id = ud.id
        ) AS has_legal
      FROM mx_data.user_data ud
      LEFT JOIN LATERAL (
        SELECT c.contact_value, c.contact_type_id
        FROM mx_data.user_contact c
        WHERE (ud.user_id IS NOT NULL AND c.user_id = ud.user_id)
           OR (ud.user_id IS NULL AND c.user_data_id = ud.id)
        ORDER BY c.is_default DESC, c.updated_at DESC
        LIMIT 1
      ) uc ON TRUE
      LEFT JOIN mx_dic.dic_contact_type dct ON dct.id = uc.contact_type_id
      LEFT JOIN public."user" u ON u.id = ud.user_id
      WHERE ud.id = $1
      LIMIT 1
    `;

    const result = await pool.query<ClientView>(sql, [userDataId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[getClientById] Помилка отримання клієнта:', error);
    throw error;
  }
}
