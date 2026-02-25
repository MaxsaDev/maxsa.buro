import { Heart, Phone } from 'lucide-react';
import Link from 'next/link';

import { ProfileSection } from '@/components/profile/shared';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { getClientContacts } from '@/data/mx-data/clients';
import { contactIconMap } from '@/lib/icon/get-icon';

interface ClientContactsViewProps {
  userDataId: string;
}

/**
 * Async Server Component — read-only список контактів клієнта.
 * Аналог UserContactsView в адмін-панелі.
 */
export async function ClientContactsView({ userDataId }: ClientContactsViewProps) {
  const contacts = await getClientContacts(userDataId);

  return (
    <ProfileSection
      title="Контактна інформація"
      description="Способи зв'язку з клієнтом"
      icon={<Phone className="size-5" />}
    >
      {contacts.length === 0 ? (
        <p className="text-muted-foreground text-sm">Контакти відсутні</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => {
            const IconComponent = contactIconMap[contact.contact_type_code] || Phone;

            return (
              <Item key={contact.id} variant="outline">
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
                  <ItemDescription className="text-xs">
                    {contact.contact_type_title}
                  </ItemDescription>
                </ItemContent>

                {contact.is_default && (
                  <div className="flex items-center pr-1">
                    <Heart className="fill-warning text-warning size-4" />
                  </div>
                )}
              </Item>
            );
          })}
        </div>
      )}
    </ProfileSection>
  );
}
