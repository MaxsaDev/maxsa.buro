'use client';

import { usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { data } from '@/lib';

interface BreadcrumbInfo {
  parent?: string;
  child: string;
}

interface DynamicBreadcrumbProps {
  appSupportMenu?: Array<{
    id: number;
    title: string;
    url: string;
    icon: string;
  }>;
}

/**
 * Ищет информацию для "хлебных крошек" на основе пути.
 * @param {string | null} pathname - Текущий URL-путь.
 * @param {Array} appSupportMenu - Меню підтримки з БД.
 * @returns {BreadcrumbInfo | null} Найденная информация или null.
 */
export const findBreadcrumbInfo = (
  pathname: string | null,
  appSupportMenu: Array<{ id: number; title: string; url: string; icon: string }> = []
): BreadcrumbInfo | null => {
  if (!pathname) return null;

  // Поиск по основным разделам (двухуровневая навигация)
  const mainNavs = [...data.navAdminSections, ...data.navUserSections];
  for (const nav of mainNavs) {
    if (nav.items) {
      for (const item of nav.items) {
        if (item.url === pathname) {
          return { parent: nav.title, child: item.title };
        }
      }
    }
  }

  // Поиск по вспомогательным и общим разделам (одноуровневая навигация)
  const otherNavs = [...appSupportMenu, ...data.navAdminItems, ...data.navUserItems];
  for (const item of otherNavs) {
    if (item.url === pathname) {
      return { child: 'name' in item ? item.name : item.title };
    }
  }

  return null;
};

/**
 * Компонент для динамічного відображення "хлібних крихт"
 */
export function DynamicBreadcrumb({ appSupportMenu = [] }: DynamicBreadcrumbProps) {
  const pathname = usePathname();
  const breadcrumbInfo = findBreadcrumbInfo(pathname, appSupportMenu);

  // Спеціальний випадок для адмін-панелі
  if (pathname === '/mx-admin') {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Головна</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Адмін-панель</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Спеціальний випадок для Dashboard
  if (pathname === '/dashboard') {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Спеціальний випадок для профілю
  if (pathname === '/profile') {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Головна</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Профіль</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Якщо інформація про шлях не знайдена
  if (!breadcrumbInfo) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Загальний випадок з батьківським елементом
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Головна</BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbInfo.parent && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{breadcrumbInfo.parent}</BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{breadcrumbInfo.child}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

DynamicBreadcrumb.displayName = 'DynamicBreadcrumb';
