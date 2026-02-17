export interface UserView {
  id: string;
  name: string;
  full_name: string | null;
  email: string;
  email_verified: Date | null;
  image: string | null;
  role: string | null;
  is_banned: boolean;
  two_factor_enabled: boolean;
  has_passkey: boolean;
  created_at: Date;
  updated_at: Date;
}
