import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Phone, User } from 'lucide-react';
import Link from 'next/link';

import { ProfileBadge, ProfileInfoRow, ProfileSection } from '@/components/profile/shared';
import { Separator } from '@/components/ui/separator';
import type { UserFullData } from '@/data/mx-data/user-data';
import { contactIconMap } from '@/lib/icon/get-icon';

interface UserDataViewProps {
  user: UserFullData;
}

/**
 * Компонент для відображення даних користувача в адмін-панелі
 * Read-only версія profile-info без функціоналу редагування
 */
export function UserDataView({ user }: UserDataViewProps) {
  // Форматування дат
  const formattedCreatedAt = user.createdAt
    ? format(new Date(user.createdAt), 'dd MMMM yyyy, HH:mm', { locale: uk })
    : 'Не вказано';

  const formattedUserDataUpdatedAt = user.user_data_updated_at
    ? format(new Date(user.user_data_updated_at), 'dd MMMM yyyy, HH:mm', { locale: uk })
    : 'Не вказано';

  // Перевірка чи email підтверджено
  const isEmailVerified = user.emailVerified !== null;

  // Отримуємо іконку для основного контакту
  const DefaultContactIcon =
    user.default_contact_type_code && contactIconMap[user.default_contact_type_code]
      ? contactIconMap[user.default_contact_type_code]
      : Phone;

  return (
    <ProfileSection
      title="Основна інформація"
      description="Дані облікового запису користувача"
      icon={<User className="size-5" />}
    >
      <div className="space-y-4">
        {/* Аватар та псевдонім */}
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full">
            <User className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-full">
                <h3 className="text-lg font-medium">{user.name}</h3>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Інформаційні поля */}
        <div className="space-y-3">
          <ProfileInfoRow label="Псевдонім" value={user.name} />
          <ProfileInfoRow
            label="Повне імʼя"
            value={user.full_name || <span className="text-muted-foreground">Не вказано</span>}
          />

          <ProfileInfoRow label="Email/Логін" value={user.email} />
          {user.default_contact_value && (
            <ProfileInfoRow
              label="Основний контакт"
              value={
                <div className="flex items-center gap-2">
                  <DefaultContactIcon className="text-muted-foreground size-4" />
                  {user.default_contact_url ? (
                    <Link
                      href={user.default_contact_url}
                      target="_blank"
                      className="text-sm font-medium hover:underline"
                    >
                      {user.default_contact_value}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium">{user.default_contact_value}</span>
                  )}
                  {user.default_contact_type_title && (
                    <span className="text-muted-foreground text-xs">
                      ({user.default_contact_type_title})
                    </span>
                  )}
                </div>
              }
            />
          )}
          {user.role && (
            <ProfileInfoRow
              label="Роль"
              value={
                <ProfileBadge variant={user.role === 'admin' ? 'info' : 'default'}>
                  {user.role === 'admin' ? 'Адміністратор' : 'Користувач'}
                </ProfileBadge>
              }
            />
          )}
          <ProfileInfoRow
            label="Email підтверджено"
            value={
              <ProfileBadge variant={isEmailVerified ? 'success' : 'warning'}>
                {isEmailVerified ? '✓ Підтверджено' : '× Не підтверджено'}
              </ProfileBadge>
            }
          />

          <ProfileInfoRow label="Зареєстрований" value={formattedCreatedAt} />
          <ProfileInfoRow label="Персональні дані від" value={formattedUserDataUpdatedAt} />
        </div>
      </div>
    </ProfileSection>
  );
}
