import type { ReactNode } from 'react';

/**
 * Типи badge для профілю
 */
export type ProfileBadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Props для ProfileBadge компонента
 */
interface ProfileBadgeProps {
  /** Варіант відображення (колір) */
  variant?: ProfileBadgeVariant;
  /** Текст або ReactNode */
  children: ReactNode;
  /** CSS класи для кастомізації */
  className?: string;
}

/**
 * Конфігурація стилів для кожного варіанту badge
 */
const badgeConfig: Record<ProfileBadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-destructive/15 text-destructive',
  info: 'bg-info/15 text-info',
};

/**
 * Unified Badge Component для профілю
 *
 * Використовується для відображення статусів, ролей та інших badges
 *
 * @example
 * ```tsx
 * <ProfileBadge variant="success">✓ Підтверджено</ProfileBadge>
 * <ProfileBadge variant="warning">Не підтверджено</ProfileBadge>
 * <ProfileBadge variant="info">Адміністратор</ProfileBadge>
 * ```
 */
export function ProfileBadge({ variant = 'default', children, className = '' }: ProfileBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${badgeConfig[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
