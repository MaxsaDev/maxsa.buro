'use server';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';

import { updateUserImage } from '@/data/auth/user';
import { getUserById } from '@/data/auth/users';
import { ActionStatus } from '@/interfaces/action-status';
import { normalizeAndTransliterate } from '@/lib/format/text';
import { getCurrentUser } from '@/lib/auth/auth-server';

// Конфігурація S3 клієнта
const s3Client = new S3Client({
  region: process.env.NEXT_AWS_S3_REGION as string,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.NEXT_AWS_S3_SECRET_ACCESS_KEY as string,
  },
});

/**
 * Завантажити файл в S3
 */
const uploadFileToS3 = async (
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> => {
  const params = {
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME as string,
    Key: fileName,
    Body: file,
    ContentType: contentType,
  };

  const command = new PutObjectCommand(params);

  try {
    await s3Client.send(command);
    return fileName;
  } catch (error) {
    console.error('[uploadFileToS3] Помилка завантаження в S3:', error);
    throw error;
  }
};

/**
 * Видалити файл з S3
 */
const deleteFileFromS3 = async (fileName: string): Promise<void> => {
  const params = {
    Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME as string,
    Key: fileName,
  };

  const command = new DeleteObjectCommand(params);

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('[deleteFileFromS3] Помилка видалення з S3:', error);
    throw error;
  }
};

/**
 * Завантажити аватар користувача
 */
export async function uploadAvatarAction(formData: FormData): Promise<ActionStatus> {
  try {
    // Перевірка авторизації
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return {
        status: 'error',
        message: 'Користувач не авторизований',
      };
    }

    // Отримуємо актуальні дані користувача з БД (Better Auth кешує дані)
    const dbUser = await getUserById(sessionUser.id);
    if (!dbUser) {
      return {
        status: 'error',
        message: 'Користувача не знайдено в БД',
      };
    }

    const user = {
      ...sessionUser,
      image: dbUser.image || null, // Використовуємо актуальне значення з БД
    };

    // Отримання файлу з FormData
    const file = formData.get('file') as File;
    if (!file) {
      return {
        status: 'error',
        message: 'Файл не знайдено',
      };
    }

    // Валідація розміру файлу
    if (file.size > 5 * 1024 * 1024) {
      return {
        status: 'error',
        message: 'Розмір файлу не повинен перевищувати 5 МБ',
      };
    }

    // Валідація типу файлу
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        status: 'error',
        message: 'Дозволені формати: JPEG, PNG, WebP, GIF',
      };
    }

    // Отримуємо старий аватар для видалення
    const oldImagePath = user.image;

    // Конвертація файлу в Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Декодуємо ім'я файлу (виправляємо кодування)
    let decodedFileName = file.name;
    try {
      const decodedBuffer = Buffer.from(file.name, 'latin1');
      const decoded = decodedBuffer.toString('utf8');
      if (/[а-яёґєіїъы]/i.test(decoded)) {
        decodedFileName = decoded;
      }
    } catch (error) {
      console.warn("Не вдалося декодувати ім'я файлу:", error);
    }

    // Отримуємо розширення файлу
    const fileExtension = decodedFileName.split('.').pop()?.toLowerCase() || 'jpg';

    // Нормалізуємо та транслітеруємо ім'я файлу
    const normalizedFileName = normalizeAndTransliterate(
      `avatar-${user.id}-${Date.now()}.${fileExtension}`
    );

    // Формування шляху файлу
    const fileName = `avatars/${user.id}/${normalizedFileName}`;

    try {
      // Завантаження файлу в S3
      await uploadFileToS3(buffer, fileName, file.type);

      // Формуємо повний URL для збереження в БД
      const imageUrl = `/${fileName}`;

      // Оновлення аватара в БД
      await updateUserImage(user.id, imageUrl);

      // Видалення старого файлу з S3 (якщо він існує)
      if (oldImagePath) {
        try {
          // Видаляємо префікс URL, якщо він є
          const oldPath = oldImagePath.startsWith('/') ? oldImagePath.slice(1) : oldImagePath;
          await deleteFileFromS3(oldPath);
        } catch (deleteError) {
          console.error('[uploadAvatarAction] Помилка видалення старого аватара:', deleteError);
          // Продовжуємо навіть якщо видалення не вдалося
        }
      }

      revalidatePath('/profile');
      revalidatePath('/(protected)', 'layout');

      return {
        status: 'success',
        message: 'Аватар успішно завантажено',
      };
    } catch (uploadError) {
      console.error('[uploadAvatarAction] Помилка завантаження:', uploadError);
      return {
        status: 'error',
        message:
          uploadError instanceof Error
            ? `Помилка при завантаженні аватара: ${uploadError.message}`
            : 'Помилка при завантаженні аватара',
      };
    }
  } catch (error) {
    console.error('[uploadAvatarAction] Помилка завантаження аватара:', error);
    return {
      status: 'error',
      message: 'Помилка при завантаженні аватара',
    };
  }
}

/**
 * Видалити аватар користувача
 */
export async function deleteAvatarAction(): Promise<ActionStatus> {
  try {
    // Перевірка авторизації
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return {
        status: 'error',
        message: 'Користувач не авторизований',
      };
    }

    // Отримуємо актуальні дані користувача з БД (Better Auth кешує дані)
    const dbUser = await getUserById(sessionUser.id);
    if (!dbUser) {
      return {
        status: 'error',
        message: 'Користувача не знайдено в БД',
      };
    }

    const user = {
      ...sessionUser,
      image: dbUser.image || null, // Використовуємо актуальне значення з БД
    };

    // Перевірка наявності аватара
    if (!user.image) {
      return {
        status: 'error',
        message: 'Аватар не знайдено',
      };
    }

    try {
      // Видаляємо префікс URL, якщо він є
      const imagePath = user.image.startsWith('/') ? user.image.slice(1) : user.image;
      await deleteFileFromS3(imagePath);
    } catch (s3Error) {
      console.error('[deleteAvatarAction] Помилка видалення файлу з S3:', s3Error);
      // Продовжуємо видалення з БД навіть якщо S3 видалення не вдалося
    }

    // Оновлення аватара в БД (встановлюємо null)
    await updateUserImage(user.id, null);

    revalidatePath('/profile');
    revalidatePath('/(protected)', 'layout');

    return {
      status: 'success',
      message: 'Аватар успішно видалено',
    };
  } catch (error) {
    console.error('[deleteAvatarAction] Помилка видалення аватара:', error);
    return {
      status: 'error',
      message:
        error instanceof Error
          ? `Помилка при видаленні аватара: ${error.message}`
          : 'Помилка при видаленні аватара',
    };
  }
}
