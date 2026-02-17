'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface NavItemsProps {
  items: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
  label?: string;
}

/**
 * Компонент для відображення простих пунктів меню (без підменю)
 * Відповідає структури даних nav-user-items
 */
export function NavItems({ items, label }: NavItemsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

NavItems.displayName = 'NavItems';
