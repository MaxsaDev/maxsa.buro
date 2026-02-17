import { create } from 'zustand';

import type { MenuItem, MenuSection } from '@/lib/menu/types';

interface UserMenuState {
  sections: MenuSection[];
  items: MenuItem[];
  isInitialized: boolean;
  setMenu: (sections: MenuSection[], items: MenuItem[]) => void;
  updateMenu: (sections: MenuSection[], items: MenuItem[]) => void;
  clearMenu: () => void;
}

export const useUserMenuStore = create<UserMenuState>((set) => ({
  sections: [],
  items: [],
  isInitialized: false,
  setMenu: (sections, items) =>
    set({
      sections,
      items,
      isInitialized: true,
    }),
  updateMenu: (sections, items) =>
    set({
      sections,
      items,
    }),
  clearMenu: () =>
    set({
      sections: [],
      items: [],
      isInitialized: false,
    }),
}));
