export interface UserPermissionsCategory {
  id: number;
  title: string;
  description: string | null;
  icon: string;
  is_active: boolean;
}

export interface UserPermissionsItem {
  id: number;
  category_id: number;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}
