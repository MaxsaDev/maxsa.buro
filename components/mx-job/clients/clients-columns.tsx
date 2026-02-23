'use client';

import { ColumnDef } from '@tanstack/react-table';
import { BriefcaseBusiness, Eye, Phone } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ClientView } from '@/interfaces/mx-data/client-view';
import { contactIconMap } from '@/lib/icon/get-icon';

export const clientsColumns: ColumnDef<ClientView>[] = [
  // ========== Клієнт (Avatar + full_name + user_name) ==========
  {
    accessorKey: 'full_name',
    header: () => <div>Клієнт</div>,
    cell: ({ row }) => {
      const fullName = row.original.full_name;
      const userName = row.original.user_name;
      const image = row.original.user_image;

      const initials = fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return (
        <div className="flex items-center gap-x-3">
          <Avatar className="size-8">
            <AvatarImage src={image || undefined} alt={fullName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center gap-0.5">
            <div className="leading-tight font-medium">{fullName}</div>
            {userName && <div className="text-muted-foreground text-xs">@{userName}</div>}
          </div>
        </div>
      );
    },
    enableGlobalFilter: true,
  },

  // Прихована колонка для пошуку за user_name
  {
    accessorKey: 'user_name',
    header: 'Псевдонім',
    enableGlobalFilter: true,
  },

  // ========== Основний контакт ==========
  {
    accessorKey: 'contact_value',
    header: () => <div>Основний контакт</div>,
    cell: ({ row }) => {
      const contactValue = row.original.contact_value;
      const contactTypeCode = row.original.contact_type_code;
      const contactUrl = row.original.contact_url;

      if (!contactValue) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }

      const IconComponent =
        contactTypeCode && contactIconMap[contactTypeCode]
          ? contactIconMap[contactTypeCode]
          : Phone;

      return (
        <div className="flex items-center gap-2">
          <IconComponent className="text-muted-foreground size-4 shrink-0" />
          {contactUrl ? (
            <Link
              href={contactUrl}
              target="_blank"
              className="text-sm hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {contactValue}
            </Link>
          ) : (
            <span className="text-sm">{contactValue}</span>
          )}
        </div>
      );
    },
    enableGlobalFilter: true,
  },

  // ========== Юридична особа ==========
  {
    accessorKey: 'has_legal',
    header: () => <div className="text-center">Юр. особа</div>,
    cell: ({ row }) => {
      const hasLegal = row.original.has_legal;
      return (
        <div className="flex justify-center">
          {hasLegal ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <BriefcaseBusiness className="text-info size-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Юридична особа</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>
      );
    },
    enableGlobalFilter: false,
    enableSorting: false,
  },

  // ========== Дії ==========
  {
    id: 'actions',
    header: () => <div className="text-center">Дії</div>,
    cell: ({ row }) => {
      const userDataId = row.original.user_data_id;
      return (
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" asChild>
                  <Link href={`/mx-job/clients/${userDataId}`}>
                    <Eye className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Переглянути картку клієнта</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    enableGlobalFilter: false,
    enableSorting: false,
  },

  // ========== Приховані колонки для пошуку ==========
  {
    accessorKey: 'user_data_id',
    header: 'ID',
    enableGlobalFilter: false,
  },
  {
    accessorKey: 'contact_type_code',
    header: 'Тип контакту',
    enableGlobalFilter: false,
  },
  {
    accessorKey: 'created_at',
    header: 'Створено',
    enableGlobalFilter: false,
  },
];
