'use client';

import { DeleteSessionButton } from '@/components/mx-admin/sessions/delete-session-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SessionView } from '@/interfaces/auth/session-view';
import { formatRelativeToNow } from '@/lib/format';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { CheckCircle2, XCircle } from 'lucide-react';

export const columns: ColumnDef<SessionView>[] = [
  {
    accessorKey: 'user_name',
    header: () => <div>Користувач</div>,
    cell: ({ row }) => {
      const session = row.original;
      const name = session.user_name;
      const email = session.user_email;
      const image = session.user_image;

      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

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
            <div className="text-muted-foreground text-xs">{email}</div>
          </div>
        </div>
      );
    },
    enableGlobalFilter: true,
  },

  {
    accessorKey: 'ip_address',
    header: () => <div>IP-адреса</div>,
    cell: ({ row }) => {
      const ipAddress = row.original.ip_address;
      return (
        <div className="font-mono text-sm">
          {ipAddress || <span className="text-muted-foreground">—</span>}
        </div>
      );
    },
    enableGlobalFilter: true,
  },

  {
    accessorKey: 'user_agent',
    header: () => <div>Пристрій</div>,
    cell: ({ row }) => {
      const userAgent = row.original.user_agent;

      if (!userAgent) {
        return <span className="text-muted-foreground">—</span>;
      }

      // Спрощений парсинг User-Agent для показу основної інформації
      const getDeviceInfo = (ua: string): string => {
        // Браузер
        let browser = 'Невідомий браузер';
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('Opera')) browser = 'Opera';

        // ОС
        let os = '';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iOS')) os = 'iOS';

        return os ? `${browser} на ${os}` : browser;
      };

      const deviceInfo = getDeviceInfo(userAgent);

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="max-w-[200px] truncate text-sm" title={userAgent}>
              {deviceInfo}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[400px] wrap-break-word">
            <p className="text-xs">{userAgent}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
    enableGlobalFilter: true,
  },

  {
    accessorKey: 'created_at',
    header: () => <div>Створено</div>,
    cell: ({ row }) => {
      const createdAt = row.original.created_at;
      const formattedDate = format(new Date(createdAt), 'dd.MM.yyyy HH:mm', { locale: uk });
      const relativeTime = formatRelativeToNow(new Date(createdAt), { addSuffix: true });

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm">{relativeTime}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{formattedDate}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'expires_at',
    header: () => <div>Закінчується</div>,
    cell: ({ row }) => {
      const expiresAt = row.original.expires_at;
      const formattedDate = format(new Date(expiresAt), 'dd.MM.yyyy HH:mm', { locale: uk });
      const relativeTime = formatRelativeToNow(new Date(expiresAt), { addSuffix: true });

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm">{relativeTime}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{formattedDate}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'updated_at',
    header: () => <div>Остання активність</div>,
    cell: ({ row }) => {
      const updatedAt = row.original.updated_at;
      const formattedDate = format(new Date(updatedAt), 'dd.MM.yyyy HH:mm', { locale: uk });
      const relativeTime = formatRelativeToNow(new Date(updatedAt), { addSuffix: true });

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm">{relativeTime}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{formattedDate}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
    enableGlobalFilter: false,
  },

  {
    accessorKey: 'is_active',
    header: () => <div className="text-center">Статус</div>,
    cell: ({ row }) => {
      const isActive = row.original.is_active;

      return (
        <div className="flex justify-center">
          {isActive ? (
            <div className="bg-success/10 text-success inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium">
              <CheckCircle2 className="h-3 w-3" />
              Активна
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium">
              <XCircle className="h-3 w-3" />
              Закінчилась
            </div>
          )}
        </div>
      );
    },
    enableGlobalFilter: false,
    enableSorting: false,
  },

  {
    id: 'actions',
    header: () => <div className="text-center">Дії</div>,
    cell: ({ row }) => {
      const session = row.original;

      return (
        <div className="flex items-center justify-center gap-1">
          <DeleteSessionButton sessionId={session.id} isActive={session.is_active} />
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
    accessorKey: 'user_id',
    header: 'User ID',
    enableGlobalFilter: false,
  },
];
