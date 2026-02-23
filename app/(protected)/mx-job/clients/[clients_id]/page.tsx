import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { ArrowLeft, BriefcaseBusiness, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getClientById, getClientLegal } from '@/data/mx-data/clients';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { contactIconMap } from '@/lib/icon/get-icon';

interface Props {
  params: Promise<{ clients_id: string }>;
}

export default async function Page({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { clients_id } = await params;
  const client = await getClientById(clients_id);

  if (!client) notFound();

  const legal = client.has_legal ? await getClientLegal(clients_id) : null;

  const initials = client.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const ContactIcon =
    client.contact_type_code && contactIconMap[client.contact_type_code]
      ? contactIconMap[client.contact_type_code]
      : Phone;

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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Основна інформація */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4" />
              Основна інформація
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Повне імʼя</span>
              <span className="text-right font-medium">{client.full_name}</span>
            </div>

            {client.contact_value && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Основний контакт</span>
                <div className="flex items-center gap-1.5">
                  <ContactIcon className="text-muted-foreground size-3.5 shrink-0" />
                  {client.contact_url ? (
                    <Link
                      href={client.contact_url}
                      target="_blank"
                      className="font-medium hover:underline"
                    >
                      {client.contact_value}
                    </Link>
                  ) : (
                    <span className="font-medium">{client.contact_value}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Доданий</span>
              <span className="font-medium">
                {format(new Date(client.created_at), 'dd MMMM yyyy', { locale: uk })}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Оновлений</span>
              <span className="font-medium">
                {format(new Date(client.updated_at), 'dd MMMM yyyy', { locale: uk })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Юридичні дані */}
        {legal && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BriefcaseBusiness className="size-4" />
                Юридичні дані
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">ЄДРПОУ</span>
                <span className="font-mono font-medium">{legal.data_edrpou}</span>
              </div>
              {legal.tin && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">ІПН</span>
                  <span className="font-mono font-medium">{legal.tin}</span>
                </div>
              )}
              {legal.data_address_legal && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Юр. адреса</span>
                  <span className="text-right font-medium">{legal.data_address_legal}</span>
                </div>
              )}
              {legal.data_address && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Факт. адреса</span>
                  <span className="text-right font-medium">{legal.data_address}</span>
                </div>
              )}
              {legal.data_bank && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Банк</span>
                  <span className="text-right font-medium">{legal.data_bank}</span>
                </div>
              )}
              {legal.data_account && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Р/р</span>
                  <span className="text-right font-mono font-medium break-all">
                    {legal.data_account}
                  </span>
                </div>
              )}
              {legal.mfo_bank && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">МФО</span>
                  <span className="font-mono font-medium">{legal.mfo_bank}</span>
                </div>
              )}
              {legal.post_director && legal.data_director && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Директор</span>
                  <span className="text-right font-medium">
                    {legal.post_director}: {legal.data_director}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
