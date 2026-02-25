import { z } from 'zod';

import { validateContactValue } from '@/schemas/profile/personal-data-schema';

/**
 * Схема валідації повного імені клієнта
 * На відміну від онбордингу — дозволяє будь-які символи (клієнти можуть бути нерезидентами)
 */
export const clientFullNameSchema = z
  .string()
  .min(2, { message: 'Імʼя має містити щонайменше 2 символи' })
  .max(100, { message: 'Імʼя не може бути довшим за 100 символів' })
  .refine((val) => val.trim().length >= 2, { message: 'Введіть коректне імʼя' });

/**
 * Схема окремого контакту для форми
 */
export const clientContactItemSchema = z.object({
  contact_type_id: z.number().int().positive(),
  contact_type_code: z.string(),
  contact_type_title: z.string(),
  contact_value: z.string().min(1, { message: 'Введіть значення контакту' }),
});

export type ClientContactItem = z.infer<typeof clientContactItemSchema>;

/**
 * Схема юридичних даних клієнта
 */
export const clientLegalSchema = z.object({
  data_edrpou: z
    .string()
    .min(8, { message: 'ЄДРПОУ має містити 8 або 10 цифр' })
    .max(10, { message: 'ЄДРПОУ має містити 8 або 10 цифр' })
    .regex(/^\d+$/, { message: 'ЄДРПОУ має містити тільки цифри' }),
  data_address: z.string().max(250).optional(),
  data_address_legal: z.string().max(250).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().max(50).optional(),
  tin: z.string().max(12).optional(),
  data_account: z.string().max(29).optional(),
  data_bank: z.string().max(50).optional(),
  mfo_bank: z
    .string()
    .max(6)
    .optional()
    .refine((val) => !val || /^\d{6}$/.test(val), {
      message: 'МФО має містити 6 цифр',
    }),
  post_director: z.string().max(255).optional(),
  data_director: z.string().max(50).optional(),
  phone_director: z.string().max(20).optional(),
  data_accountant: z.string().max(50).optional(),
  phone_accountant: z.string().max(20).optional(),
  data_contact: z.string().max(50).optional(),
  phone_contact: z.string().max(20).optional(),
  description: z.string().max(250).optional(),
});

export type ClientLegalFormValues = z.infer<typeof clientLegalSchema>;

/**
 * Реекспорт validateContactValue для використання у формі клієнта
 */
export { validateContactValue };
