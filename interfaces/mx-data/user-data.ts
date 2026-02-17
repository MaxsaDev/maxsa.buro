export interface UserData {
  id: string;
  user_id: string;
  full_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserDataWithContactView {
  user_data_id: string;
  user_id: string;
  user_name: string;
  user_image: string | null;
  full_name: string;
  created_at: Date;
  updated_at: Date;
  contact_value: string | null;
  contact_type_code: string | null;
  contact_type_id: number | null;
  contact_url: string;
}
