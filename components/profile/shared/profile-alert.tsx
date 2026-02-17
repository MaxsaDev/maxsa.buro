import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react';

/**
 * Типи alert блоків профілю
 */
export type ProfileAlertVariant = 'info' | 'success' | 'warning' | 'error' | 'note';

/**
 * Props для ProfileAlert компонента
 */
interface ProfileAlertProps {
  /** Варіант відображення (колір та іконка) */
  variant: ProfileAlertVariant;
  /** Заголовок alert блоку (опціонально) */
  title?: string;
  /** Основний текст або ReactNode */
  children: ReactNode;
  /** CSS класи для кастомізації */
  className?: string;
}

/**
 * Конфігурація стилів для кожного варіанту alert
 */
const alertConfig: Record<
  ProfileAlertVariant,
  {
    bgColor: string;
    borderColor: string;
    textColor: string;
    titleColor: string;
    icon: typeof Info;
    iconColor: string;
  }
> = {
  info: {
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
    textColor: 'text-info',
    titleColor: 'text-info',
    icon: Info,
    iconColor: 'text-info',
  },
  success: {
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    textColor: 'text-success',
    titleColor: 'text-success',
    icon: CheckCircle2,
    iconColor: 'text-success',
  },
  warning: {
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    textColor: 'text-warning',
    titleColor: 'text-warning',
    icon: AlertTriangle,
    iconColor: 'text-warning',
  },
  error: {
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    textColor: 'text-destructive',
    titleColor: 'text-destructive',
    icon: XCircle,
    iconColor: 'text-destructive',
  },
  note: {
    bgColor: 'bg-muted',
    borderColor: 'border-border',
    textColor: 'text-muted-foreground',
    titleColor: 'text-foreground',
    icon: AlertCircle,
    iconColor: 'text-muted-foreground',
  },
};

/**
 * Unified Alert Component для профілю
 *
 * Використовується для всіх інформаційних блоків в профілі:
 * - Попередження
 * - Успішні повідомлення
 * - Помилки
 * - Інформаційні блоки
 * - Примітки
 *
 * @example
 * ```tsx
 * // Попередження про одноразову зміну імені
 * <ProfileAlert variant="warning" title="⚠️ Важливо!">
 *   Ви можете змінити імʼя тільки один раз.
 * </ProfileAlert>
 *
 * // Успішне повідомлення
 * <ProfileAlert variant="success">
 *   ✓ Двохфакторна аутентифікація активна
 * </ProfileAlert>
 *
 * // Інформаційний блок
 * <ProfileAlert variant="info" title="Що таке Passkey?">
 *   Це найбезпечніший спосіб входу без пароля.
 * </ProfileAlert>
 * ```
 */
export function ProfileAlert({ variant, title, children, className = '' }: ProfileAlertProps) {
  const config = alertConfig[variant];
  const Icon = config.icon;

  return (
    <div className={`rounded-md border p-4 ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className="flex gap-3">
        <Icon className={`size-5 shrink-0 ${config.iconColor}`} />
        <div className={`flex-1 text-sm ${config.textColor}`}>
          {title && <p className={`mb-1 font-semibold ${config.titleColor}`}>{title}</p>}
          <div className={title ? 'mt-1' : ''}>{children}</div>
        </div>
      </div>
    </div>
  );
}
