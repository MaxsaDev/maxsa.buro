'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

import type { MenuItem, MenuSection } from '@/lib/menu/types';
import { useUserMenuStore } from '@/store/user-menu/user-menu-store';

interface MenuProviderProps {
  children: React.ReactNode;
  initialSections: MenuSection[];
  initialItems: MenuItem[];
}

/**
 * Порівнює два масиви секцій меню на рівність
 */
function areSectionsEqual(sections1: MenuSection[], sections2: MenuSection[]): boolean {
  if (sections1.length !== sections2.length) return false;

  return sections1.every((section1, index) => {
    const section2 = sections2[index];
    if (
      section1.menuId !== section2.menuId ||
      section1.menuTitle !== section2.menuTitle ||
      section1.menuSortOrder !== section2.menuSortOrder ||
      section1.title !== section2.title ||
      section1.url !== section2.url ||
      section1.icon !== section2.icon ||
      section1.isActive !== section2.isActive
    ) {
      return false;
    }

    if (section1.items?.length !== section2.items?.length) return false;

    if (section1.items && section2.items) {
      return section1.items.every((item1, itemIndex) => {
        const item2 = section2.items![itemIndex];
        return (
          item1.id === item2.id &&
          item1.title === item2.title &&
          item1.url === item2.url &&
          item1.icon === item2.icon
        );
      });
    }

    return true;
  });
}

/**
 * Порівнює два масиви пунктів меню на рівність
 */
function areItemsEqual(items1: MenuItem[], items2: MenuItem[]): boolean {
  if (items1.length !== items2.length) return false;

  return items1.every((item1, index) => {
    const item2 = items2[index];
    return (
      item1.menuId === item2.menuId &&
      item1.menuTitle === item2.menuTitle &&
      item1.menuSortOrder === item2.menuSortOrder &&
      item1.id === item2.id &&
      item1.name === item2.name &&
      item1.url === item2.url &&
      item1.icon === item2.icon
    );
  });
}

/**
 * Provider для ініціалізації меню користувача в Zustand store
 * Ініціалізує store при монтуванні та оновлює при зміні даних з Server Component
 */
export function MenuProvider({ children, initialSections, initialItems }: MenuProviderProps) {
  const setMenu = useUserMenuStore((state) => state.setMenu);
  const updateMenu = useUserMenuStore((state) => state.updateMenu);
  const isInitialized = useUserMenuStore((state) => state.isInitialized);
  const prevSectionsRef = useRef<MenuSection[]>([]);
  const prevItemsRef = useRef<MenuItem[]>([]);

  // Використовуємо useLayoutEffect для синхронної ініціалізації перед рендером
  useLayoutEffect(() => {
    if (!isInitialized) {
      setMenu(initialSections, initialItems);
      prevSectionsRef.current = initialSections;
      prevItemsRef.current = initialItems;
    }
  }, [isInitialized, initialSections, initialItems, setMenu]);

  // Оновлюємо store при зміні даних через useEffect
  useEffect(() => {
    if (!isInitialized) return;

    const sectionsChanged = !areSectionsEqual(prevSectionsRef.current, initialSections);
    const itemsChanged = !areItemsEqual(prevItemsRef.current, initialItems);

    if (sectionsChanged || itemsChanged) {
      updateMenu(initialSections, initialItems);
      prevSectionsRef.current = initialSections;
      prevItemsRef.current = initialItems;
    }
  }, [initialSections, initialItems, isInitialized, updateMenu]);

  return <>{children}</>;
}

MenuProvider.displayName = 'MenuProvider';
