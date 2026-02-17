'use client';

import { Command } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { NavItems } from '@/components/nav-items';
import { NavSecondary } from '@/components/nav-secondary';
import { NavSections } from '@/components/nav-sections';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';

import { data } from '@/lib';
import { buildAvatarUrl } from '@/lib/avatar/build-avatar-url';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { getMenuIcon } from '@/lib/icon/get-menu-icon';
import { useUserMenuStore } from '@/store/user-menu/user-menu-store';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: ExtendedUser;
  appSupportMenu: Array<{
    id: number;
    title: string;
    url: string;
    icon: string;
  }>;
}

export function AppSidebar({ user, appSupportMenu, ...props }: AppSidebarProps) {
  // Визначаємо, чи є користувач адміністратором
  const isAdmin = user.role === 'admin';

  // Завжди використовуємо меню з Zustand store (користувацьке меню з БД)
  const storeSections = useUserMenuStore((state) => state.sections);
  const storeItems = useUserMenuStore((state) => state.items);

  const appSupportWithIcons = appSupportMenu.map((item) => ({
    ...item,
    icon: getMenuIcon(item.icon) as LucideIcon,
  }));

  const userProfileWithIcons = data.navUserProfile.map((item) => ({
    ...item,
    icon: getMenuIcon(item.icon) as LucideIcon,
  }));

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">MAXSA SP</span>
                  <span className="truncate text-xs">
                    {isAdmin ? 'Адміністратор' : 'Enterprise'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* ============================================ */}
        {/* КОРИСТУВАЦЬКЕ МЕНЮ (завжди зверху) */}
        {/* ============================================ */}

        {/* Користувацьке меню з секціями - групуємо по меню */}
        {(() => {
          // Групуємо секції по меню
          const sectionsByMenu = new Map<
            number,
            { menuTitle: string; menuSortOrder: number; sections: typeof storeSections }
          >();

          for (const section of storeSections) {
            if (!sectionsByMenu.has(section.menuId)) {
              sectionsByMenu.set(section.menuId, {
                menuTitle: section.menuTitle,
                menuSortOrder: section.menuSortOrder,
                sections: [],
              });
            }
            sectionsByMenu.get(section.menuId)!.sections.push(section);
          }

          // Сортуємо меню по sort_order
          const sortedMenus = Array.from(sectionsByMenu.entries()).sort(
            (a, b) => a[1].menuSortOrder - b[1].menuSortOrder
          );

          return sortedMenus.map(([menuId, { menuTitle, sections }]) => (
            <NavSections
              key={menuId}
              items={sections.map((section) => ({
                ...section,
                icon: getMenuIcon(section.icon) as LucideIcon,
                items: section.items?.map((item) => ({
                  ...item,
                  icon: item.icon ? (getMenuIcon(item.icon) as LucideIcon) : undefined,
                })),
              }))}
              label={menuTitle}
            />
          ));
        })()}

        {/* Прості пункти меню користувача (без підменю) - групуємо по меню */}
        {(() => {
          // Групуємо пункти по меню
          const itemsByMenu = new Map<
            number,
            { menuTitle: string; menuSortOrder: number; items: typeof storeItems }
          >();

          for (const item of storeItems) {
            if (!itemsByMenu.has(item.menuId)) {
              itemsByMenu.set(item.menuId, {
                menuTitle: item.menuTitle,
                menuSortOrder: item.menuSortOrder,
                items: [],
              });
            }
            itemsByMenu.get(item.menuId)!.items.push(item);
          }

          // Сортуємо меню по sort_order
          const sortedMenus = Array.from(itemsByMenu.entries()).sort(
            (a, b) => a[1].menuSortOrder - b[1].menuSortOrder
          );

          return sortedMenus.map(([menuId, { menuTitle, items }]) => (
            <NavItems
              key={menuId}
              items={items.map((item) => ({
                name: item.name,
                url: item.url,
                icon: getMenuIcon(item.icon) as LucideIcon,
              }))}
              label={menuTitle}
            />
          ));
        })()}

        {/* ============================================ */}
        {/* АДМІНСЬКЕ МЕНЮ (тільки для адміністраторів, знизу) */}
        {/* ============================================ */}

        {/* Адмінське меню з секціями */}
        {isAdmin && data.navAdminSections.length > 0 && (
          <NavSections
            items={data.navAdminSections.map((section) => ({
              ...section,
              icon: getMenuIcon(section.icon) as LucideIcon,
              items: section.items?.map((item) => ({
                ...item,
                icon: item.icon ? (getMenuIcon(item.icon) as LucideIcon) : undefined,
              })),
            }))}
            label="Адміністрування"
          />
        )}

        {/* Адмінські пункти меню (без підменю) */}
        {isAdmin && data.navAdminItems.length > 0 && (
          <NavItems
            items={data.navAdminItems.map((item) => ({
              name: item.name,
              url: item.url,
              icon: getMenuIcon(item.icon) as LucideIcon,
            }))}
          />
        )}

        {/* ============================================ */}
        {/* ПІДТРИМКА ТА ЗВОРОТНІЙ ЗВ'ЯЗОК (завжди знизу) */}
        {/* ============================================ */}
        {appSupportWithIcons.length > 0 && (
          <NavSecondary items={appSupportWithIcons} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: buildAvatarUrl(user.image) || undefined,
          }}
          menuItems={userProfileWithIcons}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

AppSidebar.displayName = 'AppSidebar';
