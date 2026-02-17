/**
 * Призначення меню за замовчуванням користувачам
 *
 * Ці функції автоматично призначають всі пункти меню з is_default = true
 * користувачам при реєстрації або для існуючих користувачів.
 */

import { pool } from '@/lib/db';

/**
 * Призначити меню за замовчуванням новому користувачу
 * @param userId - ID нового користувача
 * @returns Кількість призначених пунктів меню
 */
export async function assignDefaultMenuToUser(userId: string): Promise<{
  sectionsCount: number;
  itemsCount: number;
}> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Отримуємо всі пункти меню з секціями, які мають is_default = true
    // та активні (is_active = true)
    const sectionsResult = await client.query<{ id: number }>(
      `SELECT i.id
       FROM mx_dic.menu_user_sections_items i
       INNER JOIN mx_dic.menu_user_sections_category c ON c.id = i.category_id
       INNER JOIN mx_dic.menus m ON m.id = c.menu_id
       WHERE i.is_default = true
         AND i.is_active = true
         AND c.is_active = true
         AND m.is_active = true
       ORDER BY i.id`
    );

    // Отримуємо всі пункти меню без секцій, які мають is_default = true
    // та активні (is_active = true)
    const itemsResult = await client.query<{ id: number }>(
      `SELECT i.id
       FROM mx_dic.menu_user_items i
       INNER JOIN mx_dic.menus m ON m.id = i.menu_id
       WHERE i.is_default = true
         AND i.is_active = true
         AND m.is_active = true
       ORDER BY i.id`
    );

    let sectionsCount = 0;
    let itemsCount = 0;

    // Призначаємо пункти меню з секціями
    for (const row of sectionsResult.rows) {
      try {
        await client.query(
          `INSERT INTO mx_system.nav_user_sections (user_id, menu_id, created_by, is_auto_assigned)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, menu_id) DO NOTHING`,
          [userId, row.id, userId, true] // created_by = сам користувач, is_auto_assigned = true (системне призначення)
        );
        sectionsCount++;
      } catch (error) {
        // Ігноруємо помилки дублікатів (якщо пункт вже призначений)
        console.warn(`[assignDefaultMenu] Пропущено пункт меню з секціями ${row.id}:`, error);
      }
    }

    // Призначаємо пункти меню без секцій
    for (const row of itemsResult.rows) {
      try {
        await client.query(
          `INSERT INTO mx_system.nav_user_items (user_id, menu_id, created_by, is_auto_assigned)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, menu_id) DO NOTHING`,
          [userId, row.id, userId, true] // created_by = сам користувач, is_auto_assigned = true (системне призначення)
        );
        itemsCount++;
      } catch (error) {
        // Ігноруємо помилки дублікатів (якщо пункт вже призначений)
        console.warn(`[assignDefaultMenu] Пропущено пункт меню без секцій ${row.id}:`, error);
      }
    }

    await client.query('COMMIT');

    console.log(
      `[assignDefaultMenu] Призначено меню за замовчуванням користувачу ${userId}: ` +
        `${sectionsCount} пунктів з секціями, ${itemsCount} пунктів без секцій`
    );

    return { sectionsCount, itemsCount };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[assignDefaultMenu] Помилка призначення меню за замовчуванням:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Призначити меню за замовчуванням всім існуючим користувачам, які ще не мають цих пунктів меню
 *
 * Ця функція корисна, коли адміністратор встановлює нові пункти меню як "за замовчуванням"
 * і хоче призначити їх всім існуючим користувачам.
 *
 * @param userId - ID користувача, який виконує операцію (для created_by)
 * @returns Статистика призначення
 */
export async function assignDefaultMenuToAllExistingUsers(userId: string): Promise<{
  usersProcessed: number;
  sectionsAssigned: number;
  itemsAssigned: number;
}> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Отримуємо всіх користувачів
    const usersResult = await client.query<{ id: string }>('SELECT id FROM public."user"');

    // Отримуємо всі пункти меню з секціями, які мають is_default = true та активні
    const sectionsResult = await client.query<{ id: number }>(
      `SELECT i.id
       FROM mx_dic.menu_user_sections_items i
       INNER JOIN mx_dic.menu_user_sections_category c ON c.id = i.category_id
       INNER JOIN mx_dic.menus m ON m.id = c.menu_id
       WHERE i.is_default = true
         AND i.is_active = true
         AND c.is_active = true
         AND m.is_active = true
       ORDER BY i.id`
    );

    // Отримуємо всі пункти меню без секцій, які мають is_default = true та активні
    const itemsResult = await client.query<{ id: number }>(
      `SELECT i.id
       FROM mx_dic.menu_user_items i
       INNER JOIN mx_dic.menus m ON m.id = i.menu_id
       WHERE i.is_default = true
         AND i.is_active = true
         AND m.is_active = true
       ORDER BY i.id`
    );

    let usersProcessed = 0;
    let sectionsAssigned = 0;
    let itemsAssigned = 0;

    // Для кожного користувача призначаємо меню за замовчуванням
    for (const userRow of usersResult.rows) {
      usersProcessed++;

      // Призначаємо пункти меню з секціями
      for (const sectionRow of sectionsResult.rows) {
        try {
          const result = await client.query(
            `INSERT INTO mx_system.nav_user_sections (user_id, menu_id, created_by, is_auto_assigned)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, menu_id) DO NOTHING
             RETURNING id`,
            [userRow.id, sectionRow.id, userId, true]
          );
          if (result.rows.length > 0) {
            sectionsAssigned++;
          }
        } catch (error) {
          console.warn(
            `[assignDefaultMenuToAllExistingUsers] Пропущено пункт меню з секціями ${sectionRow.id} для користувача ${userRow.id}:`,
            error
          );
        }
      }

      // Призначаємо пункти меню без секцій
      for (const itemRow of itemsResult.rows) {
        try {
          const result = await client.query(
            `INSERT INTO mx_system.nav_user_items (user_id, menu_id, created_by, is_auto_assigned)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, menu_id) DO NOTHING
             RETURNING id`,
            [userRow.id, itemRow.id, userId, true]
          );
          if (result.rows.length > 0) {
            itemsAssigned++;
          }
        } catch (error) {
          console.warn(
            `[assignDefaultMenuToAllExistingUsers] Пропущено пункт меню без секцій ${itemRow.id} для користувача ${userRow.id}:`,
            error
          );
        }
      }
    }

    await client.query('COMMIT');

    console.log(
      `[assignDefaultMenuToAllExistingUsers] Оброблено ${usersProcessed} користувачів: ` +
        `призначено ${sectionsAssigned} пунктів з секціями, ${itemsAssigned} пунктів без секцій`
    );

    return { usersProcessed, sectionsAssigned, itemsAssigned };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[assignDefaultMenuToAllExistingUsers] Помилка призначення меню:', error);
    throw error;
  } finally {
    client.release();
  }
}
