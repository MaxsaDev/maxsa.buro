export interface MenuUserSectionsCategory {
  id: number;
  menu_id: number;
  title: string;
  url: string;
  icon: string;
  is_active: boolean;
}

export interface MenuUserSectionsItems {
  id: number;
  category_id: number;
  title: string;
  icon: string;
  url: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
}
