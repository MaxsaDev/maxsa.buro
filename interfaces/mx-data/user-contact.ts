export interface UserContact {
  id: string;
  user_id: string;
  contact_type_id: number;
  contact_value: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}
