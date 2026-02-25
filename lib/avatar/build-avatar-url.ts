import { AWS_S3_STORAGE_URL } from '@/lib/const';

/**
 * Формує повний URL для аватара користувача
 *
 * @param imagePath - Відносний шлях до аватара (наприклад: /avatars/user_id/filename.jpg)
 * @returns Повний URL до аватара або null якщо imagePath не надано
 *
 * @example
 * ```typescript
 * const avatarUrl = buildAvatarUrl('/avatars/user123/avatar.jpg');
 * // 'https://maxsa-soft.s3.eu-north-1.amazonaws.com/avatars/user123/avatar.jpg'
 * ```
 */
export function buildAvatarUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;

  // AWS_S3_STORAGE_URL закінчується на '/', тому видаляємо провідний '/' з imagePath
  const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${AWS_S3_STORAGE_URL}${normalizedPath}`;
}
