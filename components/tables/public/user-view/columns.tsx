'use client';

import { DeleteUserButton } from '@/components/mx-admin/users/delete-user-button';
import { DisablePasskeyButton } from '@/components/mx-admin/users/disable-passkey-button';
import { DisableTwoFactorButton } from '@/components/mx-admin/users/disable-two-factor-button';
import { ResendVerificationButton } from '@/components/mx-admin/users/resend-verification-button';
import { ToggleBanButton } from '@/components/mx-admin/users/toggle-ban-button';
import { ToggleRoleButton } from '@/components/mx-admin/users/toggle-role-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserView } from '@/interfaces/public/user-view';
import { ColumnDef } from '@tanstack/react-table';
import { Ban, Crown } from 'lucide-react';

export const columns: ColumnDef<UserView>[] = [
  {
    accessorKey: 'iconStatus',
    header: () => <div className="text-center">Статус</div>,
    cell: ({ row }) => {
      const isBanned = row.original.is_banned;
      const isAdmin = row.original.role === 'admin';

      if (isBanned) {
        return (
          <div className="flex justify-center">
            <Ban className="text-destructive h-4 w-4" />
          </div>
        );
      }

      if (isAdmin) {
        return (
          <div className="flex justify-center">
            <Crown className="text-warning h-4 w-4" />
          </div>
        );
      }

      return <div className="flex justify-center">—</div>;
    },
    enableGlobalFilter: false,
    enableSorting: false,
  },

  // {
  //   accessorKey: 'image',
  //   header: () => <div className="text-center">Аватар</div>,
  //   cell: ({ row }) => {
  //     const name = row.original.name;
  //     const image = row.original.image;
  //     const initials = name
  //       .split(' ')
  //       .map((n) => n[0])
  //       .join('')
  //       .toUpperCase();

  //     return (
  //       <div className="flex justify-center">
  //         <Avatar>
  //           <AvatarImage src={image || undefined} alt={name} />
  //           <AvatarFallback>{initials}</AvatarFallback>
  //         </Avatar>
  //       </div>
  //     );
  //   },
  //   enableGlobalFilter: false,
  //   enableSorting: false,
  // },

  {
    accessorKey: 'name',
    header: () => <div>Користувач</div>,
    cell: ({ row }) => {
      const name = row.original.name;
      const fullName = row.original.full_name;

      const image = row.original.image;
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

      return (
        <div className="flex items-center gap-x-4">
          <div className="flex items-center justify-center">
            <Avatar>
              <AvatarImage src={image || undefined} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col justify-center gap-1">
            <div className="font-medium">{name}</div>
            {fullName ? (
              <div className="text-muted-foreground text-xs">{fullName}</div>
            ) : (
              <div className="text-muted-foreground text-xs">немає персональних даних</div>
            )}
          </div>
        </div>
      );
    },
    enableGlobalFilter: true,
  },

  {
    accessorKey: 'full_name',
    header: 'Повне імʼя',
    enableGlobalFilter: true,
  },

  {
    accessorKey: 'email',
    header: () => <div>Email</div>,
    cell: ({ row }) => {
      const email = row.original.email;
      const emailVerified = row.original.email_verified;

      return (
        <div className="flex flex-col justify-center gap-1">
          <div className="font-medium">{email}</div>
          <div className={`text-xs ${emailVerified ? 'text-success' : 'text-destructive'}`}>
            {emailVerified ? 'підтверджено' : 'не підтверджено'}
          </div>
        </div>
      );
    },
    enableGlobalFilter: true,
  },

  {
    id: 'actions',
    header: () => <div className="text-center">Дії</div>,
    cell: ({ row }) => {
      const user = row.original;
      const isBanned = user.is_banned;

      return (
        <div className="flex items-center justify-center gap-1">
          {/* Зміна ролі */}
          <ToggleRoleButton
            userId={user.id}
            currentRole={user.role || 'user'}
            disabled={isBanned}
          />

          {/* Відключення 2FA */}
          <DisableTwoFactorButton
            userId={user.id}
            twoFactorEnabled={user.two_factor_enabled}
            disabled={isBanned}
          />

          {/* Відключення Passkey */}
          <DisablePasskeyButton
            userId={user.id}
            hasPasskey={user.has_passkey}
            disabled={isBanned}
          />

          {/* Повторна відправка верифікаційного листа */}
          <ResendVerificationButton
            userEmail={user.email}
            emailVerified={!!user.email_verified}
            disabled={isBanned}
          />

          {/* Бан/розбан */}
          <ToggleBanButton userId={user.id} isBanned={isBanned} />

          {/* Видалення користувача */}
          <DeleteUserButton userId={user.id} userName={user.name} />
        </div>
      );
    },
    enableGlobalFilter: false,
    enableSorting: false,
  },

  // Приховані колонки для внутрішнього використання
  {
    accessorKey: 'id',
    header: 'ID',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'email_verified',
    header: 'Email підтверджено',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'role',
    header: 'Роль',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'is_banned',
    header: 'Заблокований',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'two_factor_enabled',
    header: '2FA',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'has_passkey',
    header: 'Passkey',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'created_at',
    header: 'Створено',
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'updated_at',
    header: 'Оновлено',
    enableGlobalFilter: false,
  },
];
