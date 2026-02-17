import { z } from 'zod';

/**
 * Схема валідації для назви офісу / філії
 *
 * Правила:
 * - Мінімум 1 символ, максимум 200
 * - Не може бути тільки пробілами
 */
export const officeTitleSchema = z
  .string()
  .min(1, { message: 'Назва не може бути порожньою' })
  .max(200, { message: 'Назва не може бути довшою за 200 символів' })
  .refine(
    (val) => {
      return val.trim().length >= 1;
    },
    { message: 'Назва не може складатися тільки з пробілів' }
  );

/**
 * Схема валідації для текстових полів офісу (місто, адреса, тощо)
 *
 * Правила:
 * - Максимум 500 символів
 * - Може бути порожнім
 */
export const officeTextFieldSchema = z
  .string()
  .max(500, { message: 'Значення не може бути довшим за 500 символів' });

/**
 * Схема валідації для електронної пошти офісу
 *
 * Правила:
 * - Валідний формат email або порожній рядок
 * - Максимум 100 символів
 */
export const officeEmailSchema = z
  .string()
  .max(100, { message: 'Email не може бути довшим за 100 символів' })
  .refine(
    (val) => {
      if (val.trim() === '') return true;
      return z.string().email().safeParse(val).success;
    },
    { message: 'Некоректна email адреса' }
  );

/**
 * Схема валідації для телефону офісу
 *
 * Правила:
 * - Максимум 50 символів
 */
export const officePhoneSchema = z
  .string()
  .max(50, { message: 'Номер телефону не може бути довшим за 50 символів' });
