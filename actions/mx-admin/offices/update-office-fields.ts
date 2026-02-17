'use server';

import { revalidatePath } from 'next/cache';

import {
  updateOfficeAddress,
  updateOfficeCity,
  updateOfficeEmail,
  updateOfficeLinkMap,
  updateOfficePhone,
  updateOfficeTitle,
  updateOfficeZip,
} from '@/data/mx-dic/offices';
import type { ActionStatus } from '@/interfaces/action-status';
import { getCurrentUser } from '@/lib/auth/auth-server';
import {
  officeEmailSchema,
  officePhoneSchema,
  officeTextFieldSchema,
  officeTitleSchema,
} from '@/schemas/mx-admin/offices-schema';

// Маппінг полів на функції оновлення та схеми валідації
const fieldMap = {
  title: { update: updateOfficeTitle, schema: officeTitleSchema },
  city: { update: updateOfficeCity, schema: officeTextFieldSchema },
  address: { update: updateOfficeAddress, schema: officeTextFieldSchema },
  phone: { update: updateOfficePhone, schema: officePhoneSchema },
  email: { update: updateOfficeEmail, schema: officeEmailSchema },
  link_map: { update: updateOfficeLinkMap, schema: officeTextFieldSchema },
  zip: { update: updateOfficeZip, schema: officeTextFieldSchema },
} as const;

type OfficeField = keyof typeof fieldMap;

/**
 * Server Action для оновлення окремого поля офісу
 */
export async function updateOfficeFieldAction(
  id: number,
  field: OfficeField,
  value: string
): Promise<ActionStatus> {
  try {
    const admin = await getCurrentUser();

    if (!admin || admin.role !== 'admin') {
      return {
        status: 'error',
        message: 'Доступ заборонено. Потрібні права адміністратора.',
        code: 'FORBIDDEN',
      };
    }

    const fieldConfig = fieldMap[field];

    if (!fieldConfig) {
      return {
        status: 'error',
        message: `Невідоме поле: ${field}`,
        code: 'VALIDATION_ERROR',
      };
    }

    // Валідація через Zod схему
    const validation = fieldConfig.schema.safeParse(value);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      return {
        status: 'error',
        message: errors[0] || 'Некоректне значення',
        code: 'VALIDATION_ERROR',
      };
    }

    await fieldConfig.update(id, validation.data);

    revalidatePath('/mx-admin/offices');

    return {
      status: 'success',
      message: 'Поле успішно оновлено',
    };
  } catch (error) {
    console.error(`[updateOfficeFieldAction] Помилка оновлення поля ${field}:`, error);

    if (error instanceof Error) {
      return {
        status: 'error',
        message: error.message,
        code: 'DB_ERROR',
      };
    }

    return {
      status: 'error',
      message: 'Невідома помилка при оновленні поля',
      code: 'UNKNOWN_ERROR',
    };
  }
}
