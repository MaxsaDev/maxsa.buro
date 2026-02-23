import { create } from 'zustand';

import type { MenuGeneralItem, MenuItem, MenuSection } from '@/lib/menu/types';

interface UserMenuState {
  sections: MenuSection[];
  items: MenuItem[];
  generalItems: MenuGeneralItem[];
  isInitialized: boolean;
  setMenu: (sections: MenuSection[], items: MenuItem[], generalItems: MenuGeneralItem[]) => void;
  updateMenu: (sections: MenuSection[], items: MenuItem[], generalItems: MenuGeneralItem[]) => void;
  clearMenu: () => void;
}

export const useUserMenuStore = create<UserMenuState>((set) => ({
  sections: [],
  items: [],
  generalItems: [],
  isInitialized: false,
  setMenu: (sections, items, generalItems) =>
    set({
      sections,
      items,
      generalItems,
      isInitialized: true,
    }),
  updateMenu: (sections, items, generalItems) =>
    set({
      sections,
      items,
      generalItems,
    }),
  clearMenu: () =>
    set({
      sections: [],
      items: [],
      generalItems: [],
      isInitialized: false,
    }),
}));
