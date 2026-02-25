import { ArrowLeft, BriefcaseBusiness } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getContactTypesAction } from '@/actions/profile/get-contact-types';
import { ClientContactsView } from '@/components/mx-job/clients/client-contacts-view';
import { ClientEditView } from '@/components/mx-job/clients/client-edit-view';
import { ClientInfoView } from '@/components/mx-job/clients/client-info-view';
import { ClientTabs } from '@/components/mx-job/clients/client-tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getClientById, getClientContacts } from '@/data/mx-data/clients';
import { getCurrentUser } from '@/lib/auth/auth-server';

interface Props {
  params: Promise<{ clients_id: string }>;
}

export default async function Page({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { clients_id } = await params;
  const client = await getClientById(clients_id);
  if (!client) notFound();

  // Завантажуємо дані для вкладки "Редагування" паралельно
  const [contactTypes, contacts] = await Promise.all([
    getContactTypesAction(),
    getClientContacts(clients_id),
  ]);

  const initials = client.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Навігація */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mx-job/clients">
            <ArrowLeft className="size-4" />
            До списку клієнтів
          </Link>
        </Button>
      </div>

      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarImage src={client.user_image || undefined} alt={client.full_name} />
          <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{client.full_name}</h1>
            {client.has_legal && (
              <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                <BriefcaseBusiness className="size-3" />
                Юр. особа
              </span>
            )}
          </div>
          {client.user_name && <p className="text-muted-foreground text-sm">@{client.user_name}</p>}
        </div>
      </div>

      <Separator />

      {/* Вкладки */}
      <ClientTabs
        infoContent={
          <div className="space-y-6">
            <ClientInfoView client={client} />
            <Suspense fallback={<div className="bg-muted h-32 animate-pulse rounded-lg" />}>
              <ClientContactsView userDataId={clients_id} />
            </Suspense>
          </div>
        }
        editContent={
          <ClientEditView client={client} contactTypes={contactTypes} initialContacts={contacts} />
        }
      />
    </div>
  );
}
