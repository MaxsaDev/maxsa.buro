import { pool } from '@/lib/db';
import type { DicContactType } from '@/interfaces/mx-dic/dic-contact-type';

/**
 * Отримати всі активні типи контактів зі словника, відсортовані за sort_order
 *
 * @returns Promise<DicContactType[]> - масив активних типів контактів
 */
export async function getActiveContactTypes(): Promise<DicContactType[]> {
  try {
    const result = await pool.query<DicContactType>(
      `SELECT
        id,
        code,
        title,
        url_prefix,
        title_en,
        icon,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM mx_dic.dic_contact_type
      WHERE is_active = TRUE
      ORDER BY sort_order ASC`
    );

    return result.rows;
  } catch (error) {
    console.error('[getActiveContactTypes] Помилка отримання типів контактів:', error);
    throw new Error('Не вдалося отримати типи контактів');
  }
}

/**
 * Отримати тип контакту за кодом
 *
 * @param code - машинний код типу контакту
 * @returns Promise<DicContactType | null>
 */
export async function getContactTypeByCode(code: string): Promise<DicContactType | null> {
  try {
    const result = await pool.query<DicContactType>(
      `SELECT
        id,
        code,
        title,
        url_prefix,
        title_en,
        icon,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM mx_dic.dic_contact_type
      WHERE code = $1 AND is_active = TRUE
      LIMIT 1`,
      [code]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('[getContactTypeByCode] Помилка отримання типу контакту:', error);
    return null;
  }
}

/**
 * Маппінг кодів типів контактів на іконки Lucide React
 *
 * Використовується для відображення іконок в UI
 */
export const CONTACT_TYPE_ICONS = {
  phone: 'Phone',
  email: 'Mail',
  telegram: 'Send',
  viber: 'MessageSquare',
  whatsapp: 'MessageCircle',
  facebook: 'Facebook',
  messenger: 'MessageCircleMore',
  instagram: 'Instagram',
} as const;

export type ContactTypeCode = keyof typeof CONTACT_TYPE_ICONS;
