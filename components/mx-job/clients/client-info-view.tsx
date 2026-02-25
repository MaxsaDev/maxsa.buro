import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Phone, User, UserCheck, UserCog } from 'lucide-react';
import Link from 'next/link';

import { ProfileInfoRow, ProfileSection } from '@/components/profile/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { ClientView } from '@/interfaces/mx-data/client-view';
import { contactIconMap } from '@/lib/icon/get-icon';
import { cn } from '@/lib/utils';

interface ClientInfoViewProps {
  client: ClientView;
}

/**
 * Read-only вкладка "Інформація" на сторінці профілю клієнта.
 * Аналог UserDataView в адмін-панелі.
 */
export function ClientInfoView({ client }: ClientInfoViewProps) {
  const initials = client.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const formattedCreatedAt = format(new Date(client.created_at), 'dd MMMM yyyy, HH:mm', {
    locale: uk,
  });
  const formattedUpdatedAt = format(new Date(client.updated_at), 'dd MMMM yyyy, HH:mm', {
    locale: uk,
  });

  const ContactIcon =
    client.contact_type_code && contactIconMap[client.contact_type_code]
      ? contactIconMap[client.contact_type_code]
      : Phone;

  const isRegisteredUser = client.user_id !== null;

  return (
    <div className="space-y-6 pt-6">
      <ProfileSection
        title="Основна інформація"
        description="Персональні дані клієнта"
        icon={<User className="size-5" />}
      >
        <div className="space-y-4">
          {/* Аватар та ім'я */}
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={client.user_image || undefined} alt={client.full_name} />
              <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{client.full_name}</h3>
              {client.user_name && (
                <p className="text-muted-foreground text-sm">@{client.user_name}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Інформаційні рядки */}
          <div className="space-y-3">
            <ProfileInfoRow label="Повне імʼя" value={client.full_name} />

            {client.contact_value && (
              <ProfileInfoRow
                label="Основний контакт"
                value={
                  <div className="flex items-center gap-2">
                    <ContactIcon className="text-muted-foreground size-4" />
                    {client.contact_url ? (
                      <Link
                        href={client.contact_url}
                        target="_blank"
                        className="text-sm font-medium hover:underline"
                      >
                        {client.contact_value}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium">{client.contact_value}</span>
                    )}
                  </div>
                }
              />
            )}

            <ProfileInfoRow label="Доданий" value={formattedCreatedAt} />
            <ProfileInfoRow label="Оновлений" value={formattedUpdatedAt} />
          </div>

          <Separator />

          {/* Статусні іконки */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Статус</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {/* Користувач */}
              <div
                className={cn(
                  'rounded-lg border border-l-4 p-3',
                  isRegisteredUser ? 'border-l-success' : 'border-l-muted-foreground/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <User className="text-muted-foreground size-4" />
                  <span className="text-xs font-medium">Користувач</span>
                </div>
                <p
                  className={cn(
                    'mt-1 text-xs font-medium',
                    isRegisteredUser ? 'text-success' : 'text-muted-foreground'
                  )}
                >
                  {isRegisteredUser ? '✓ Зареєстрований' : 'Не зареєстрований'}
                </p>
              </div>

              {/* Співробітник — заглушка */}
              <div className="border-l-muted-foreground/30 rounded-lg border border-l-4 p-3">
                <div className="flex items-center gap-2">
                  <UserCog className="text-muted-foreground size-4" />
                  <span className="text-xs font-medium">Співробітник</span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs font-medium">—</p>
              </div>

              {/* Виконавець — заглушка */}
              <div className="border-l-muted-foreground/30 rounded-lg border border-l-4 p-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-muted-foreground size-4" />
                  <span className="text-xs font-medium">Виконавець</span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs font-medium">—</p>
              </div>
            </div>
          </div>
        </div>
      </ProfileSection>
    </div>
  );
}
