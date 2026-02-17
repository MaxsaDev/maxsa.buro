/**
 * Константи ID повноважень (опціонально)
 *
 * ПРИМІТКА: Використання констант не є обов'язковим.
 * Можна використовувати напряму числові ID з бази даних.
 *
 * Переваги використання констант:
 * - Автодополнення в IDE
 * - Легше рефакторити код
 *
 * Недоліки:
 * - Потрібно пам'ятати оновлювати файл при додаванні нових permissions
 * - Додатковий крок у процесі
 *
 * Рекомендація: Використовуйте напряму числові ID з БД.
 * ID можна побачити на сторінці /mx-admin/permissions
 *
 * Приклад використання напряму:
 * ```typescript
 * const hasPermission = useHasPermission(115); // ID з БД
 * ```
 *
 * Приклад використання констант (опціонально):
 * ```typescript
 * import { PERMISSION_IDS } from '@/lib/permissions/permission-ids';
 * const hasPermission = useHasPermission(PERMISSION_IDS.CLIENTS_CONTACTS_VISIBLE);
 * ```
 */
export const PERMISSION_IDS = {
  // Опціонально: додайте константи для зручності, якщо потрібно
  // CLIENTS_CONTACTS_VISIBLE: 115,
  // CREATE_DOCS_CATEGORIES: 1,
} as const;

/**
 * Тип для ID повноважень
 */
export type PermissionId = number;
