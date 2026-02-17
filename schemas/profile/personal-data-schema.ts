import { REGEX, REG_PHONE, UkrFullName } from '@/lib/regexp';
import { z } from 'zod';

/**
 * Схема валідації для повного імені користувача
 *
 * Правила:
 * - Тільки українська кирилиця (без російських букв Ё, Ъ, Ы, Э)
 * - Пробіли, апостроф, дефіс дозволені
 * - Мінімум 2 символи, максимум 100
 */
export const fullNameSchema = z
  .string()
  .min(2, { message: 'Повне імʼя має містити щонайменше 2 символи' })
  .max(100, { message: 'Повне імʼя не може бути довшим за 100 символів' })
  .regex(UkrFullName, {
    message: 'Тільки українська кирилиця, пробіли, апостроф та дефіс',
  })
  .refine(
    (val) => {
      // Перевірка що не тільки пробіли
      return val.trim().length >= 2;
    },
    { message: 'Введіть коректне повне імʼя' }
  );

/**
 * Валідація номера телефону
 * Використовує готову регулярку з REG_PHONE
 */
const phoneSchema = z
  .string()
  .min(1, { message: 'Введіть номер телефону' })
  .refine(
    (val) => {
      // Нормалізуємо: видаляємо всі символи крім цифр
      const normalized = val.replace(/\D/g, '');
      return REG_PHONE.test(normalized);
    },
    {
      message: 'Некоректний номер телефону. Формат: +380XXXXXXXXX або код країни + номер',
    }
  );

/**
 * Валідація email
 */
const emailSchema = z.string().min(1, { message: 'Введіть email адресу' }).regex(REGEX.email, {
  message: 'Некоректний формат email адреси',
});

/**
 * Валідація Telegram username або номера телефону
 */
const telegramSchema = z
  .string()
  .min(1, { message: 'Введіть Telegram username або номер' })
  .refine(
    (val) => {
      // Дозволяємо номер телефону
      const normalized = val.replace(/\D/g, '');
      if (REG_PHONE.test(normalized)) {
        return true;
      }
      // Або username/посилання
      return REGEX.telegram.test(val);
    },
    {
      message: 'Некоректний формат. Приклад: +380501234567, @username або https://t.me/username',
    }
  );

/**
 * Валідація Facebook профілю
 */
const facebookSchema = z
  .string()
  .min(1, { message: 'Введіть username або посилання на Facebook профіль' })
  .regex(REGEX.facebook, {
    message: 'Некоректний формат. Приклад: username або https://facebook.com/username',
  });

/**
 * Валідація Instagram профілю
 */
const instagramSchema = z
  .string()
  .min(1, { message: 'Введіть username або посилання на Instagram профіль' })
  .regex(REGEX.instagram, {
    message: 'Некоректний формат. Приклад: @username або https://instagram.com/username',
  });

/**
 * Валідація Messenger профілю
 */
const messengerSchema = z
  .string()
  .min(1, { message: 'Введіть username або посилання на Messenger профіль' })
  .regex(REGEX.messenger, {
    message: 'Некоректний формат. Приклад: username або https://m.me/username',
  });

/**
 * Валідація WhatsApp (номер телефону або посилання)
 */
const whatsappSchema = z
  .string()
  .min(1, { message: 'Введіть номер WhatsApp' })
  .refine(
    (val) => {
      // Дозволяємо номер телефону
      const normalized = val.replace(/\D/g, '');
      if (REG_PHONE.test(normalized)) {
        return true;
      }
      // Або посилання WhatsApp
      return REGEX.whatsapp.test(val);
    },
    {
      message: 'Некоректний формат. Приклад: +380501234567 або https://wa.me/380501234567',
    }
  );

/**
 * Валідація Viber (номер телефону або посилання)
 */
const viberSchema = z
  .string()
  .min(1, { message: 'Введіть номер Viber' })
  .refine(
    (val) => {
      // Дозволяємо номер телефону
      const normalized = val.replace(/\D/g, '');
      if (REG_PHONE.test(normalized)) {
        return true;
      }
      // Або посилання Viber
      return REGEX.viber.test(val);
    },
    {
      message: 'Некоректний формат. Приклад: +380501234567 або https://viber.com/username',
    }
  );

/**
 * Мапа схем валідації для кожного типу контакту
 */
export const contactValidationSchemas: Record<string, z.ZodTypeAny> = {
  phone: phoneSchema,
  email: emailSchema,
  telegram: telegramSchema,
  facebook: facebookSchema,
  instagram: instagramSchema,
  messenger: messengerSchema,
  whatsapp: whatsappSchema,
  viber: viberSchema,
};

/**
 * Функція для валідації значення контакту залежно від типу
 *
 * @param value - значення контакту
 * @param contactTypeCode - код типу контакту
 * @returns об'єкт з результатом валідації
 */
export function validateContactValue(
  value: string,
  contactTypeCode: string
): { success: boolean; error?: string } {
  const schema = contactValidationSchemas[contactTypeCode];

  if (!schema) {
    return { success: false, error: 'Невідомий тип контакту' };
  }

  const result = schema.safeParse(value);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError?.message || 'Некоректне значення',
    };
  }

  return { success: true };
}

/**
 * Головна схема форми персональних даних
 */
export const personalDataFormSchema = z.object({
  full_name: fullNameSchema,
  // contact_value валідується динамічно через validateContactValue
  contact_value: z.string().optional(),
});

export type PersonalDataFormValues = z.infer<typeof personalDataFormSchema>;
