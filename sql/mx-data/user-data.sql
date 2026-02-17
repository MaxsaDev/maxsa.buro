-- ======================================================
-- ПІДГОТОВКА
-- ======================================================
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS mx_data;

-- ======================================================
-- ТАБЛИЦЯ ПРОФІЛЮ КОРИСТУВАЧА
-- ======================================================
/*
  1:1 до public."user" (Better Auth, id => text).
  Бізнес-вимога: профіль має мати ≥1 контакт у mx_data.user_contact.
*/
DROP TABLE IF EXISTS mx_data.user_data CASCADE;
CREATE TABLE IF NOT EXISTS mx_data.user_data (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL UNIQUE,     -- FK → public."user"(id)
  full_name   text NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_data_user_fk
    FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE
);

COMMENT ON TABLE mx_data.user_data IS
'Профілі користувачів. Кожен профіль повинен мати щонайменше один контакт у mx_data.user_contact.';

-- Представлення «профіль + актуальний контакт» (дефолтний або найсвіжіший)
-- оновлений мінімалістичний VIEW: додаємо лише contact_url (дешевий обчислюваний текст)
DROP VIEW IF EXISTS mx_data.user_data_with_contact_view;
CREATE OR REPLACE VIEW mx_data.user_data_with_contact_view AS
SELECT
  ud.id            AS user_data_id,
  ud.user_id,
  u.name AS user_name,
  u.image AS user_image,
  ud.full_name,
  ud.created_at,
  ud.updated_at,

  uc.contact_value,
  dct.code         AS contact_type_code,
  uc.contact_type_id,

  -- клікабельна URL, побудована за code + value
  mx_data.fn_contact_build_url(dct.code, uc.contact_value) AS contact_url
FROM mx_data.user_data ud
    LEFT JOIN LATERAL (
      SELECT c.contact_value, c.contact_type_id
      FROM mx_data.user_contact c
      WHERE c.user_id = ud.user_id
      ORDER BY c.is_default DESC, c.updated_at DESC
      LIMIT 1
    ) uc ON TRUE
    LEFT JOIN mx_dic.dic_contact_type dct   ON dct.id = uc.contact_type_id
    LEFT JOIN public."user" u ON u.id = ud.user_id;

COMMENT ON VIEW mx_data.user_data_with_contact_view IS
'Профіль користувача + актуальний контакт (дефолтний або найсвіжіший) з підписом типу із словника.';
