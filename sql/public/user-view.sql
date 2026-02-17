DROP VIEW IF EXISTS public.user_view;
CREATE OR REPLACE VIEW public.user_view AS
SELECT
  u.id,
  u.name,
  ud.full_name,
  u.email,
  u."emailVerified" AS email_verified,
  u.image,
  u.role,
  u."isBanned" AS is_banned,
  u."twoFactorEnabled" AS two_factor_enabled,
  EXISTS(SELECT 1 FROM passkey p WHERE p."userId" = u.id) AS has_passkey,
  u."createdAt" AS created_at,
  u."updatedAt" AS updated_at
FROM public."user" u
LEFT JOIN mx_data.user_data ud ON ud.user_id = u.id;
