'use client';

import { CopyButton } from '@/components/copy-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserDataWithContactView } from '@/interfaces/mx-data/user-data';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

export const columns: ColumnDef<UserDataWithContactView>[] = [
  {
    accessorKey: 'full_name',
    header: () => <div>Користувач</div>,
    cell: ({ row }) => {
      const user_name = row.original.user_name;
      const full_name = row.original.full_name;
      const image = row.original.user_image;

      const initials = full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center gap-x-4">
          <div className="flex items-center justify-center">
            <Avatar>
              <AvatarImage src={image || undefined} alt={full_name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col justify-center gap-1">
            <div className="font-medium">{full_name}</div>
            <div className="text-muted-foreground text-xs">{user_name}</div>
          </div>
        </div>
      );
    },
    enableGlobalFilter: true,
  },

  {
    accessorKey: 'user_id',
    header: 'User ID',
    cell: ({ row }) => {
      const user_id = row.original.user_id;
      return (
        <div className="text-muted-foreground flex flex-row items-center gap-x-2 text-xs">
          <p className="bg-muted max-w-[250px] rounded-md p-2 font-mono text-xs wrap-break-word">
            {user_id}
          </p>
          <div
            onClick={(e) => {
              // Запобігаємо переходу на сторінку користувача при кліку на кнопку копіювання
              e.stopPropagation();
            }}
          >
            <CopyButton text={user_id} />
          </div>
        </div>
      );
    },
    enableGlobalFilter: false, // UUID поле - КРИТИЧНО для поиска платежей
  },

  {
    accessorKey: 'contact_value',
    header: () => <div>Контакт</div>,
    cell: ({ row }) => {
      const contact_value = row.original.contact_value;
      const contact_url = row.original.contact_url;

      return (
        <div className="flex flex-col justify-center gap-1">
          <Link
            href={contact_url}
            target="_blank"
            onClick={(e) => {
              // Запобігаємо переходу на сторінку користувача при кліку на посилання
              e.stopPropagation();
            }}
          >
            <div className="font-medium">{contact_value}</div>
          </Link>
        </div>
      );
    },
    enableGlobalFilter: true,
  },

  // Приховані колонки для внутрішнього використання
  {
    accessorKey: 'user_data_id',
    header: 'user_data_id',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'user_name',
    header: 'user_name',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'created_at',
    header: 'created_at',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'updated_at',
    header: 'updated_at',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'contact_type_code',
    header: 'contact_type_code',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'contact_type_id',
    header: 'contact_type_id',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'contact_url',
    header: 'contact_url',
    enableGlobalFilter: false,
  },
];
