export interface DicContactType {
  id: number;
  code: string;
  title: string;
  url_prefix: string | null;
  title_en: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
