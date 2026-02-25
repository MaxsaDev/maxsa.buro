export interface AssigneeView {
  assignee_id: string;
  user_data_id: string;
  user_id: string | null;
  full_name: string;
  post_assignee_id: number;
  post_assignee_title: string;
  description: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  contact_value: string | null;
  contact_type_code: string | null;
  contact_type_id: number | null;
  contact_url: string | null;
  user_name: string | null;
  user_image: string | null;
  is_banned: boolean | null;
}
