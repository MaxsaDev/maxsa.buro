'use client';

import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useState, useTransition } from 'react';

import { setMyDefaultOfficeAction } from '@/actions/profile/set-my-default-office';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import type { UserOfficeUserView } from '@/interfaces/mx-system/user-offices';

interface OfficeSwitcherProps {
  offices: UserOfficeUserView[];
}

export const OfficeSwitcher = ({ offices }: OfficeSwitcherProps) => {
  const defaultOffice = offices.find((o) => o.office_is_default) || offices[0];
  const [selectedOffice, setSelectedOffice] = useState(defaultOffice);
  const [, startTransition] = useTransition();

  // Обробка вибору офісу
  const handleSelectOffice = (office: UserOfficeUserView) => {
    if (office.office_id === selectedOffice.office_id) return;

    const previousOffice = selectedOffice;

    // Оптимістичне оновлення
    setSelectedOffice(office);

    startTransition(async () => {
      const result = await setMyDefaultOfficeAction(office.office_id);
      if (result.status === 'error') {
        // Відкат при помилці
        setSelectedOffice(previousOffice);
      }
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{selectedOffice.office_title}</span>
                {selectedOffice.office_city && (
                  <span className="truncate text-xs">{selectedOffice.office_city}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)" align="start">
            {offices.map((office) => (
              <DropdownMenuItem key={office.office_id} onSelect={() => handleSelectOffice(office)}>
                <div className="grid flex-1 leading-tight">
                  <span className="font-medium">{office.office_title}</span>
                  {office.office_city && (
                    <span className="text-muted-foreground text-xs">{office.office_city}</span>
                  )}
                </div>
                {office.office_id === selectedOffice.office_id && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

OfficeSwitcher.displayName = 'OfficeSwitcher';
