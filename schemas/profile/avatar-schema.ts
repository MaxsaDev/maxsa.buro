import { z } from 'zod';

/**
 * Схема валідації для завантаження аватара
 */
export const AvatarUploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'Файл обовʼязковий' })
    .refine((file) => file.size > 0, {
      message: 'Файл не може бути порожнім',
    })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'Розмір файлу не повинен перевищувати 5 МБ',
    })
    .refine(
      (file) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        return allowedTypes.includes(file.type);
      },
      {
        message: 'Дозволені формати: JPEG, PNG, WebP, GIF',
      }
    ),
});

export type AvatarUploadInput = z.infer<typeof AvatarUploadSchema>;
