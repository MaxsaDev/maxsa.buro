import type { AssigneeView } from '@/interfaces/mx-data/assignee';
import { pool } from '@/lib/db';

/**
 * Отримати список всіх виконавців
 */
export async function getAssignees(): Promise<AssigneeView[]> {
  try {
    const sql = `SELECT * FROM mx_data.assignee_data_view ORDER BY full_name`;
    const result = await pool.query<AssigneeView>(sql);
    return result.rows;
  } catch (error) {
    console.error('[getAssignees] Помилка отримання списку виконавців:', error);
    throw error;
  }
}

/**
 * Отримати виконавця за assignee_id
 */
export async function getAssigneeById(assigneeId: string): Promise<AssigneeView | null> {
  try {
    const sql = `
      SELECT * FROM mx_data.assignee_data_view
      WHERE assignee_id = $1
      LIMIT 1
    `;
    const result = await pool.query<AssigneeView>(sql, [assigneeId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[getAssigneeById] Помилка отримання виконавця:', error);
    throw error;
  }
}

/**
 * Перевірити чи є особа вже виконавцем
 */
export async function checkIsAssignee(userDataId: string): Promise<boolean> {
  try {
    const sql = `
      SELECT EXISTS (
        SELECT 1 FROM mx_data.assignee_data WHERE user_data_id = $1
      ) AS exists
    `;
    const result = await pool.query<{ exists: boolean }>(sql, [userDataId]);
    return result.rows[0]?.exists ?? false;
  } catch (error) {
    console.error('[checkIsAssignee] Помилка перевірки статусу виконавця:', error);
    throw error;
  }
}

/**
 * Призначити особу виконавцем.
 * Атомарно: INSERT assignee_data + INSERT assignee_offices (для офісу за замовчуванням).
 */
export async function createAssignee(
  userDataId: string,
  postAssigneeId: number,
  createdBy: string,
  defaultOfficeId: number
): Promise<{ assignee_id: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Отримуємо user_id (якщо є акаунт) з user_data
    const userDataResult = await client.query<{ user_id: string | null }>(
      `SELECT user_id FROM mx_data.user_data WHERE id = $1 LIMIT 1`,
      [userDataId]
    );

    if (!userDataResult.rows[0]) {
      throw new Error('Запис персональних даних не знайдено');
    }

    const userId = userDataResult.rows[0].user_id;

    // Вставляємо виконавця
    const assigneeResult = await client.query<{ id: string }>(
      `INSERT INTO mx_data.assignee_data (user_data_id, user_id, post_assignee_id, updated_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userDataId, userId, postAssigneeId, createdBy]
    );

    const assigneeId = assigneeResult.rows[0]?.id;
    if (!assigneeId) {
      throw new Error('Не вдалося створити запис виконавця');
    }

    // Прив'язуємо до офісу за замовчуванням
    await client.query(
      `INSERT INTO mx_data.assignee_offices (assignee_data_id, office_id, is_default)
       VALUES ($1, $2, TRUE)`,
      [assigneeId, defaultOfficeId]
    );

    await client.query('COMMIT');
    return { assignee_id: assigneeId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[createAssignee] Помилка призначення виконавця:', error);
    throw error;
  } finally {
    client.release();
  }
}
