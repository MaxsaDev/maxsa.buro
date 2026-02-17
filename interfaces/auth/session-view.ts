export interface SessionView {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  user_name: string;
  user_email: string;
  user_image: string | null;
  is_active: boolean; // вычисляемое поле: expires_at > NOW()
}
