export interface NavUserItems {
  id: number;
  user_id: string;
  menu_id: number;
  office_id: number;
  created_at: Date;
  created_by: string;
  is_auto_assigned: boolean;
}

export interface NavUserItemsUserView {
  user_id: string;
  office_id: number;

  menu_id: number;
  menu_title: string;
  menu_sort_order: number;

  item_id: number;
  item_title: string;
  item_icon: string;
  item_url: string;
  item_sort_order: number;
  item_is_active_global: boolean;
}

export interface NavUserItemsAdminView {
  user_id: string;
  user_name: string;

  office_id: number;
  office_title: string;

  menu_id: number;
  menu_title: string;
  menu_sort_order: number;

  item_id: number;
  item_title: string;
  item_icon: string;
  item_url: string;
  item_sort_order: number;
  item_is_active_global: boolean;

  item_is_assigned: boolean;
  item_is_effective_active: boolean;

  nav_user_item_id: number | null;
  created_at: Date | null;
  created_by: string | null;
}
