export interface NavUserSections {
  id: number;
  user_id: string;
  menu_id: number;
  created_at: Date;
  created_by: string;
  is_auto_assigned: boolean;
}
export interface NavUserSectionsAdminView {
  user_id: string;
  user_name: string;

  menu_id: number;
  menu_title: string;
  menu_sort_order: number;

  category_id: number;
  category_title: string;
  category_url: string;
  category_icon: string;
  category_is_active: boolean;

  item_id: number;
  item_title: string;
  item_icon: string;
  item_url: string;
  item_sort_order: number;
  item_is_active_global: boolean;

  item_is_assigned: boolean;
  item_is_effective_active: boolean;

  nav_user_section_id: number | null;
  created_at: Date | null;
  created_by: string | null;
}

export interface NavUserSectionsUserView {
  user_id: string;

  menu_id: number;
  menu_title: string;
  menu_sort_order: number;

  category_id: number;
  category_title: string;
  category_url: string;
  category_icon: string;
  category_is_active: boolean;

  item_id: number;
  item_title: string;
  item_icon: string;
  item_url: string;
  item_sort_order: number;
  item_is_active_global: boolean;
}
