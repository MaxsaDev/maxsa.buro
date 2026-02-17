import type { ReactNode } from 'react';

/**
 * Props для ProfileInfoRow компонента
 */
interface ProfileInfoRowProps {
  /** Мітка (label) для поля */
  label: string;
  /** Значення поля або ReactNode (для badges, статусів) */
  value: ReactNode;
  /** CSS класи для кастомізації */
  className?: string;
}

/**
 * Unified Info Row для відображення інформації в профілі
 *
 * Використовується для відображення інформації в єдиному стилі:
 * - Імʼя: username
 * - Email: user@example.com
 * - Роль: Користувач / Адміністратор
 * - Email підтверджено: ✓ Підтверджено
 *
 * @example
 * ```tsx
 * <ProfileInfoRow label="Імʼя" value={user.name} />
 *
 * <ProfileInfoRow
 *   label="Роль"
 *   value={
 *     <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
 *       Користувач
 *     </span>
 *   }
 * />
 * ```
 */
export function ProfileInfoRow({ label, value, className = '' }: ProfileInfoRowProps) {
  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <dt className="text-muted-foreground text-sm">{label}:</dt>
      <dd className="col-span-2 text-sm font-medium">{value}</dd>
    </div>
  );
}
