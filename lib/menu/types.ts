/**
 * Загальні типи для меню користувача
 * Використовуються для передачі даних між Server Components та Client Components
 */

export interface MenuSectionItem {
  id?: number;
  title: string;
  url: string;
  icon?: string; // Рядкове ім'я іконки
}

export interface MenuSection {
  menuId: number;
  menuTitle: string;
  menuSortOrder: number;
  title: string;
  url: string;
  icon: string; // Рядкове ім'я іконки
  isActive?: boolean;
  items?: MenuSectionItem[];
}

export interface MenuItem {
  menuId: number;
  menuTitle: string;
  menuSortOrder: number;
  id?: number;
  name: string;
  url: string;
  icon: string; // Рядкове ім'я іконки
}

export interface MenuGeneralItem {
  menuId: number;
  menuTitle: string;
  menuSortOrder: number;
  id?: number;
  name: string;
  url: string;
  icon: string; // Рядкове ім'я іконки
}
