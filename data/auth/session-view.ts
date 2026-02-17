'use server';

import { pool } from '@/lib/db';

import type { SessionView } from '@/interfaces/auth/session-view';

/**
 * Параметри фільтрації сесій
 */
export interface GetSessionsFilters {
  /**
   * Показувати тільки активні сесії (expires_at > NOW())
   * Якщо null - показувати всі
   */
  onlyActive?: boolean | null;
  /**
   * Пошук по імені або email користувача
   */
  userSearch?: string | null;
  /**
   * Фільтр по даті створення (від)
   */
  dateFrom?: Date | null;
  /**
   * Фільтр по даті створення (до)
   */
  dateTo?: Date | null;
}

/**
 * Отримати список сесій з інформацією про користувачів
 */
export const getSessions = async (filters?: GetSessionsFilters): Promise<SessionView[]> => {
  try {
    const { onlyActive = true, userSearch = null, dateFrom = null, dateTo = null } = filters || {};

    // Будую SQL запит з динамічними фільтрами
    let query = `
      SELECT
        s.id,
        s."userId" as user_id,
        s."ipAddress" as ip_address,
        s."userAgent" as user_agent,
        s."expiresAt" as expires_at,
        s."createdAt" as created_at,
        s."updatedAt" as updated_at,
        u.name as user_name,
        u.email as user_email,
        u.image as user_image,
        CASE
          WHEN s."expiresAt" > NOW() THEN true
          ELSE false
        END as is_active
      FROM session s
      JOIN "user" u ON s."userId" = u.id
      WHERE 1=1
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    // Фільтр по активності (по замовчуванню тільки активні)
    if (onlyActive === true) {
      query += ` AND s."expiresAt" > NOW()`;
    }

    // Фільтр по користувачу (пошук по імені або email)
    if (userSearch && userSearch.trim().length > 0) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${userSearch.trim()}%`);
      paramIndex++;
    }

    // Фільтр по даті створення (від)
    if (dateFrom) {
      query += ` AND s."createdAt" >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    // Фільтр по даті створення (до)
    if (dateTo) {
      query += ` AND s."createdAt" <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    query += ` ORDER BY s."createdAt" DESC`;

    const result = await pool.query<SessionView>(query, params);

    return result.rows;
  } catch (error) {
    console.error('[Data Auth SessionView] Помилка отримання списку сесій:', error);
    throw new Error('Не вдалося отримати список сесій');
  }
};
