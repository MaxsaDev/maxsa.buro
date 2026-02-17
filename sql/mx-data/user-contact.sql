CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS mx_data;

-- ======================================================
-- ТАБЛИЦЯ КОНТАКТІВ
-- ======================================================
DROP TABLE IF EXISTS mx_data.user_contact CASCADE;
CREATE TABLE IF NOT EXISTS mx_data.user_contact (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text NOT NULL,                          -- FK → public."user"
  contact_type_id smallint NOT NULL,                      -- FK → mx_dic.dic_contact_type(id)
  contact_value   citext  NOT NULL,                       -- значення (номер/емейл/@username/URL)
  is_default      boolean NOT NULL DEFAULT false,         -- рівно один TRUE на user_id

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_contact_user_fk
    FOREIGN KEY (user_id)         REFERENCES public."user"(id)           ON DELETE CASCADE,
  CONSTRAINT user_contact_type_fk
    FOREIGN KEY (contact_type_id) REFERENCES mx_dic.dic_contact_type(id) ON DELETE RESTRICT,

  CONSTRAINT user_contact_unique_per_user UNIQUE (user_id, contact_type_id, contact_value)
);

COMMENT ON TABLE mx_data.user_contact IS
'Контакти користувачів (словникові типи). Забезпечує множинні канали зв’язку; рівно один is_default=TRUE на user_id.';

-- Індекси
CREATE INDEX IF NOT EXISTS user_contact_user_idx        ON mx_data.user_contact (user_id);
CREATE INDEX IF NOT EXISTS user_contact_type_idx        ON mx_data.user_contact (contact_type_id);

-- Partial-UNIQUE: один дефолтний контакт на користувача
DROP INDEX IF EXISTS mx_data.user_contact_default_one_per_user_idx;
CREATE UNIQUE INDEX IF NOT EXISTS user_contact_default_one_per_user_idx
  ON mx_data.user_contact (user_id)
  WHERE is_default = TRUE;
