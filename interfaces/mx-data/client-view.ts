export interface ClientView {
  user_data_id: string;
  user_id: string | null;
  user_name: string | null;
  user_image: string | null;
  full_name: string;
  created_at: Date;
  updated_at: Date;
  contact_value: string | null;
  contact_type_code: string | null;
  contact_type_id: number | null;
  contact_url: string | null;
  has_legal: boolean;
}

export interface ClientLegal {
  id: string;
  user_data_id: string;
  data_address: string | null;
  data_address_legal: string | null;
  phone: string | null;
  email: string | null;
  data_edrpou: string;
  tin: string | null;
  data_account: string | null;
  data_bank: string | null;
  mfo_bank: string | null;
  post_director: string | null;
  data_director: string | null;
  phone_director: string | null;
  data_accountant: string | null;
  phone_accountant: string | null;
  data_contact: string | null;
  phone_contact: string | null;
  description: string | null;
}

export interface DuplicateContactResult {
  exists: boolean;
  full_name?: string;
  contact_value?: string;
  contact_type_code?: string;
}
