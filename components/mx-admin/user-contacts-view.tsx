import { Phone } from 'lucide-react';
import Link from 'next/link';

import { ProfileSection } from '@/components/profile/shared';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { contactIconMap } from '@/lib/icon/get-icon';
import { getUserContacts } from '@/data/mx-data/user-contact';

interface UserContactsViewProps {
  userId: string;
}

/**
 * Компонент для відображення списку контактів користувача в адмін-панелі
 * Read-only версія personal-data-section без функціоналу редагування
 */
export async function UserContactsView({ userId }: UserContactsViewProps) {
  // Отримуємо всі контакти користувача
  const contacts = await getUserContacts(userId);

  // Якщо контактів немає
  if (contacts.length === 0) {
    return (
      <ProfileSection
        title="Контактна інформація"
        description="Контактні дані користувача"
        icon={<Phone className="size-5" />}
      >
        <p className="text-muted-foreground text-sm">Немає контактів</p>
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      title="Контактна інформація"
      description="Контактні дані користувача"
      icon={<Phone className="size-5" />}
    >
      <div className="space-y-2">
        {contacts.map((contact) => {
          // Отримуємо іконку для типу контакту
          const IconComponent = contactIconMap[contact.contact_type_code] || Phone;

          return (
            <Item key={contact.id} variant="outline">
              {/* Іконка типу контакту */}
              <ItemMedia variant="icon">
                <IconComponent className="size-4" />
              </ItemMedia>

              <ItemContent>
                <ItemTitle>
                  {contact.contact_url ? (
                    <Link
                      href={contact.contact_url}
                      target="_blank"
                      className="font-medium hover:underline"
                    >
                      {contact.contact_value}
                    </Link>
                  ) : (
                    <span className="font-medium">{contact.contact_value}</span>
                  )}
                </ItemTitle>
                <ItemDescription className="text-xs">{contact.contact_type_title}</ItemDescription>
              </ItemContent>
            </Item>
          );
        })}
      </div>
    </ProfileSection>
  );
}
