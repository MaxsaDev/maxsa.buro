import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Props для ProfileSection компонента
 */
interface ProfileSectionProps {
  /** Заголовок секції */
  title: string;
  /** Опис секції (опціонально) */
  description?: string;
  /** Контент секції */
  children: ReactNode;
  /** CSS класи для кастомізації */
  className?: string;
  /** Іконка для заголовку (опціонально) */
  icon?: ReactNode;
}

/**
 * Unified Section Wrapper для профілю
 *
 * Обгортає кожен логічний блок в профілі в Card з єдиним стилем
 *
 * Використовується для:
 * - Основна інформація
 * - Імʼя користувача
 * - Зміна пароля
 * - 2FA
 * - Passkey
 * - Персональні дані
 * - Контактні дані
 *
 * @example
 * ```tsx
 * <ProfileSection
 *   title="Зміна пароля"
 *   description="Оновіть пароль для свого облікового запису"
 * >
 *   <ChangePasswordForm />
 * </ProfileSection>
 * ```
 *
 * @example
 * // З іконкою
 * ```tsx
 * <ProfileSection
 *   title="Додати Passkey"
 *   description="Швидкий та безпечний вхід без пароля"
 *   icon={<Fingerprint className="size-5" />}
 * >
 *   <PasskeySetup />
 * </ProfileSection>
 * ```
 */
export function ProfileSection({
  title,
  description,
  children,
  className = '',
  icon,
}: ProfileSectionProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className={icon ? 'flex items-center gap-2' : ''}>
          {icon}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
