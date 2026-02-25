'use server';

import type { Office } from '@/interfaces/mx-dic/offices';
import { pool } from '@/lib/db';

/**
 * Отримати всі офіси
 */
export async function getOffices(): Promise<Office[]> {
  try {
    const sql = `
      SELECT
        id,
        title,
        city,
        address,
        phone,
        email,
        link_map,
        latitude,
        longitude,
        zip,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM mx_dic.offices
      ORDER BY sort_order ASC
    `;
    const result = await pool.query<Office>(sql);
    return result.rows;
  } catch (error) {
    console.error('[getOffices] Помилка отримання офісів:', error);
    throw new Error('Не вдалося отримати офіси');
  }
}

/**
 * Створити новий офіс
 */
export async function createOffice(title: string): Promise<Office> {
  try {
    const sql = `
      INSERT INTO mx_dic.offices (title, is_active)
      VALUES ($1, TRUE)
      RETURNING id, title, city, address, phone, email, link_map, latitude, longitude, zip, sort_order, is_active, created_at, updated_at
    `;
    const result = await pool.query<Office>(sql, [title]);
    if (result.rows.length === 0) {
      throw new Error('Не вдалося створити офіс');
    }
    return result.rows[0];
  } catch (error) {
    console.error('[createOffice] Помилка створення офісу:', error);
    throw new Error('Не вдалося створити офіс');
  }
}

/**
 * Оновити назву офісу
 */
export async function updateOfficeTitle(id: number, title: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET title = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [title, id]);
  } catch (error) {
    console.error('[updateOfficeTitle] Помилка оновлення назви офісу:', error);
    throw new Error('Не вдалося оновити назву офісу');
  }
}

/**
 * Оновити місто офісу
 */
export async function updateOfficeCity(id: number, city: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET city = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [city, id]);
  } catch (error) {
    console.error('[updateOfficeCity] Помилка оновлення міста офісу:', error);
    throw new Error('Не вдалося оновити місто офісу');
  }
}

/**
 * Оновити адресу офісу
 */
export async function updateOfficeAddress(id: number, address: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET address = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [address, id]);
  } catch (error) {
    console.error('[updateOfficeAddress] Помилка оновлення адреси офісу:', error);
    throw new Error('Не вдалося оновити адресу офісу');
  }
}

/**
 * Оновити телефон офісу
 */
export async function updateOfficePhone(id: number, phone: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET phone = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [phone, id]);
  } catch (error) {
    console.error('[updateOfficePhone] Помилка оновлення телефону офісу:', error);
    throw new Error('Не вдалося оновити телефон офісу');
  }
}

/**
 * Оновити email офісу
 */
export async function updateOfficeEmail(id: number, email: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET email = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [email, id]);
  } catch (error) {
    console.error('[updateOfficeEmail] Помилка оновлення email офісу:', error);
    throw new Error('Не вдалося оновити email офісу');
  }
}

/**
 * Оновити посилання на карту офісу
 */
export async function updateOfficeLinkMap(id: number, linkMap: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET link_map = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [linkMap, id]);
  } catch (error) {
    console.error('[updateOfficeLinkMap] Помилка оновлення посилання на карту офісу:', error);
    throw new Error('Не вдалося оновити посилання на карту офісу');
  }
}

/**
 * Оновити поштовий індекс офісу
 */
export async function updateOfficeZip(id: number, zip: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET zip = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [zip, id]);
  } catch (error) {
    console.error('[updateOfficeZip] Помилка оновлення поштового індексу офісу:', error);
    throw new Error('Не вдалося оновити поштовий індекс офісу');
  }
}

/**
 * Оновити широту офісу
 */
export async function updateOfficeLatitude(id: number, latitude: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET latitude = $1::NUMERIC(10,7), updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [latitude || null, id]);
  } catch (error) {
    console.error('[updateOfficeLatitude] Помилка оновлення широти офісу:', error);
    throw new Error('Не вдалося оновити широту офісу');
  }
}

/**
 * Оновити довготу офісу
 */
export async function updateOfficeLongitude(id: number, longitude: string): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET longitude = $1::NUMERIC(10,7), updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [longitude || null, id]);
  } catch (error) {
    console.error('[updateOfficeLongitude] Помилка оновлення довготи офісу:', error);
    throw new Error('Не вдалося оновити довготу офісу');
  }
}

/**
 * Оновити активність офісу
 */
export async function updateOfficeActive(id: number, isActive: boolean): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET is_active = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [isActive, id]);
  } catch (error) {
    console.error('[updateOfficeActive] Помилка оновлення активності офісу:', error);
    throw new Error('Не вдалося оновити активність офісу');
  }
}

/**
 * Оновити порядок офісу (для drag&drop)
 */
export async function updateOfficeSortOrder(id: number, sortOrder: number): Promise<void> {
  try {
    const sql = `
      UPDATE mx_dic.offices
      SET sort_order = $1, updated_at = now()
      WHERE id = $2
    `;
    await pool.query(sql, [sortOrder, id]);
  } catch (error) {
    console.error('[updateOfficeSortOrder] Помилка оновлення порядку офісу:', error);
    throw new Error('Не вдалося оновити порядок офісу');
  }
}

/**
 * Видалити офіс
 */
export async function deleteOffice(id: number): Promise<void> {
  try {
    const sql = `
      DELETE FROM mx_dic.offices
      WHERE id = $1
    `;
    await pool.query(sql, [id]);
  } catch (error) {
    console.error('[deleteOffice] Помилка видалення офісу:', error);
    throw new Error('Не вдалося видалити офіс');
  }
}
