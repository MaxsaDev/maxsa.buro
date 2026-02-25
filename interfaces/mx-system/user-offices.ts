export interface UserOffice {
  id: number;
  user_id: string;
  office_id: number;
  is_default: boolean;
  created_at: Date;
  created_by: string;
}

export interface UserOfficeAdminView {
  user_id: string;
  user_name: string;

  office_id: number;
  office_title: string;
  office_city: string | null;
  office_is_active: boolean;
  office_sort_order: number;

  office_is_assigned: boolean;
  office_is_effective_active: boolean;
  office_is_default: boolean;

  user_office_id: number | null;
  created_at: Date | null;
  created_by: string | null;
}

export interface UserOfficeUserView {
  user_id: string;

  office_id: number;
  office_title: string;
  office_city: string | null;
  office_address: string | null;
  office_phone: string | null;
  office_email: string | null;
  office_is_default: boolean;
}
