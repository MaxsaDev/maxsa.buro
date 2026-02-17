export interface Menu {
  id: number;
  title: string;
  menu_type_id: number;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
