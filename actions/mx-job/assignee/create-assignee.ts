'use server';

import { revalidatePath } from 'next/cache';

import { checkIsAssignee, createAssignee } from '@/data/mx-data/assignee';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { getUserPermissions } from '@/lib/permissions/get-user-permissions';

// Право на призначення виконавців
const ASSIGN_PERMISSION_ID = 2;

export interface CreateAssigneeSuccessStatus {
  status: 'success';
  message: string;
  assignee_ids: string[];
}

/**
 * Server Action для призначення однієї або кількох осіб виконавцями.
 * Доступно лише для користувачів з permission_id === 2.
 */
export async function createAssigneeAction(
  userDataIds: string[],
  defaultOfficeId: number
): Promise<ActionStatus | CreateAssigneeSuccessStatus> {
  try {
    // Перевірка авторизації
    const user = await getCurrentUser();
    if (!user) {
      return {
        status: 'error',
        message: 'Ви не авторизовані. Увійдіть в систему.',
        code: 'UNAUTHORIZED',
      };
    }

    // Перевірка повноважень
    const permissions = await getUserPermissions(user.id);
    const hasPermission = permissions.some((p) => p.permission_id === ASSIGN_PERMISSION_ID);
    if (!hasPermission) {
      return {
        status: 'error',
        message: 'У вас немає права призначати виконавців.',
        code: 'FORBIDDEN',
      };
    }

    // Валідація вхідних даних
    if (!userDataIds || userDataIds.length === 0) {
      return {
        status: 'error',
        message: 'Не вибрано жодного запису.',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!defaultOfficeId || defaultOfficeId <= 0) {
      return {
        status: 'error',
        message: 'Не визначено офіс за замовчуванням.',
        code: 'VALIDATION_ERROR',
      };
    }

    // Валідація uuid формату
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of userDataIds) {
      if (!uuidRegex.test(id)) {
        return {
          status: 'error',
          message: `Некоректний ідентифікатор: ${id}`,
          code: 'VALIDATION_ERROR',
        };
      }
    }

    // Перевірка що жоден з вибраних вже не є виконавцем
    for (const userDataId of userDataIds) {
      const alreadyAssignee = await checkIsAssignee(userDataId);
      if (alreadyAssignee) {
        return {
          status: 'warning',
          message: `Один або кілька вибраних записів вже є виконавцями. Оновіть сторінку та повторіть спробу.`,
          code: 'ALREADY_ASSIGNEE',
        } as ActionStatus;
      }
    }

    // Призначаємо кожного виконавцем (post_assignee_id=1 — "Кандидат" за замовчуванням)
    const assigneeIds: string[] = [];
    for (const userDataId of userDataIds) {
      const result = await createAssignee(userDataId, 1, user.id, defaultOfficeId);
      assigneeIds.push(result.assignee_id);
    }

    revalidatePath('/mx-job/clients');

    const count = assigneeIds.length;
    const message =
      count === 1 ? 'Виконавця успішно призначено' : `${count} виконавців успішно призначено`;

    console.log(
      `[createAssigneeAction] Призначено виконавців: ${assigneeIds.join(', ')} автором ${user.id}`
    );

    return {
      status: 'success',
      message,
      assignee_ids: assigneeIds,
    };
  } catch (error) {
    console.error('[createAssigneeAction] Помилка призначення виконавця:', error);

    if (error instanceof Error) {
      return { status: 'error', message: error.message, code: 'DB_ERROR' };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при призначенні виконавця',
      code: 'UNKNOWN_ERROR',
    };
  }
}
