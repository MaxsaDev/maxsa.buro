export interface Office {
  id: number;
  title: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  link_map: string | null;
  latitude: number | null;
  longitude: number | null;
  zip: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
