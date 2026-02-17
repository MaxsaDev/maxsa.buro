export interface NavUserPermissions {
  id: number;
  user_id: string;
  permission_id: number;
  created_at: Date;
  created_by: string;
}

export interface NavUserPermissionsAdminView {
  user_id: string;
  user_name: string;

  category_id: number;
  category_title: string;
  category_description: string | null;
  category_icon: string;
  category_is_active: boolean;

  permission_id: number;
  permission_title: string;
  permission_description: string | null;
  permission_sort_order: number;
  permission_is_active_global: boolean;

  permission_is_assigned: boolean;
  permission_is_effective_active: boolean;

  nav_user_permission_id: number | null;
  created_at: Date | null;
  created_by: string | null;
}

export interface NavUserPermissionsUserView {
  user_id: string;

  category_id: number;
  category_title: string;
  category_description: string | null;
  category_icon: string;
  category_is_active: boolean;

  permission_id: number;
  permission_title: string;
  permission_description: string | null;
  permission_sort_order: number;
  permission_is_active_global: boolean;
}
