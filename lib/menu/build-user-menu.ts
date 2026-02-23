import { getNavUserGeneralUserViewByUserId } from '@/data/mx-system/nav-user-general';
import { getNavUserItemsUserViewByUserId } from '@/data/mx-system/nav-user-items';
import { getNavUserSectionsUserViewByUserId } from '@/data/mx-system/nav-user-sections';

import type { MenuGeneralItem, MenuItem, MenuSection } from './types';

/**
 * Побудувати меню користувача з секціями та пунктами
 */
export async function buildUserMenu(userId: string): Promise<{
  sections: MenuSection[];
  items: MenuItem[];
  generalItems: MenuGeneralItem[];
}> {
  try {
    // Отримуємо дані меню з БД
    const [sectionsData, itemsData, generalData] = await Promise.all([
      getNavUserSectionsUserViewByUserId(userId),
      getNavUserItemsUserViewByUserId(userId),
      getNavUserGeneralUserViewByUserId(userId),
    ]);

    // Групуємо секції по меню та категоріях
    // Структура: Map<menuId, Map<categoryId, MenuSection>>
    const menusMap = new Map<number, Map<number, MenuSection>>();

    for (const item of sectionsData) {
      const menuId = item.menu_id;
      const categoryId = item.category_id;

      // Створюємо мапу для меню, якщо її немає
      if (!menusMap.has(menuId)) {
        menusMap.set(menuId, new Map());
      }

      const categoriesMap = menusMap.get(menuId)!;

      // Створюємо секцію для категорії, якщо її немає
      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          menuId: item.menu_id,
          menuTitle: item.menu_title,
          menuSortOrder: item.menu_sort_order,
          title: item.category_title,
          url: item.category_url,
          icon: item.category_icon, // Рядкове ім'я іконки
          isActive: true,
          items: [],
        });
      }

      const section = categoriesMap.get(categoryId)!;

      section.items!.push({
        id: item.item_id,
        title: item.item_title,
        url: item.item_url,
        icon: item.item_icon, // Рядкове ім'я іконки
      });
    }

    // Перетворюємо пункти меню з інформацією про меню
    const items: MenuItem[] = itemsData.map((item) => {
      return {
        menuId: item.menu_id,
        menuTitle: item.menu_title,
        menuSortOrder: item.menu_sort_order,
        id: item.item_id,
        name: item.item_title,
        url: item.item_url,
        icon: item.item_icon, // Рядкове ім'я іконки
      };
    });

    // Перетворюємо пункти загального меню (без прив'язки до офісу)
    const generalItems: MenuGeneralItem[] = generalData.map((item) => {
      return {
        menuId: item.menu_id,
        menuTitle: item.menu_title,
        menuSortOrder: item.menu_sort_order,
        id: item.item_id,
        name: item.item_title,
        url: item.item_url,
        icon: item.item_icon, // Рядкове ім'я іконки
      };
    });

    // Перетворюємо в плоский масив секцій, зберігаючи порядок меню
    const sections: MenuSection[] = [];
    const sortedMenuIds = Array.from(menusMap.keys()).sort((a, b) => {
      const menuA = sectionsData.find((item) => item.menu_id === a);
      const menuB = sectionsData.find((item) => item.menu_id === b);
      return (menuA?.menu_sort_order || 0) - (menuB?.menu_sort_order || 0);
    });

    for (const menuId of sortedMenuIds) {
      const categoriesMap = menusMap.get(menuId)!;
      const menuSections = Array.from(categoriesMap.values());
      sections.push(...menuSections);
    }

    return {
      sections,
      items,
      generalItems,
    };
  } catch (error) {
    console.error('[buildUserMenu] Помилка побудови меню користувача:', error);
    // Повертаємо порожні масиви у разі помилки
    return {
      sections: [],
      items: [],
      generalItems: [],
    };
  }
}
