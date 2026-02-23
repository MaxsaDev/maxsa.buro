CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS mx_data;

-- ======================================================
-- ТАБЛИЦЯ КОНТАКТІВ
-- ======================================================
/*
  Зберігає контакти для:
  - Зареєстрованих користувачів: user_id NOT NULL, user_data_id NULL
  - Клієнтів без акаунту: user_id NULL, user_data_id NOT NULL
  CHECK гарантує: хоча б одне з полів заповнене.
*/
DROP TABLE IF EXISTS mx_data.user_contact CASCADE;
CREATE TABLE IF NOT EXISTS mx_data.user_contact (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text,                                   -- FK → public."user"; NULL для клієнтів без акаунту
  user_data_id    uuid,                                   -- FK → mx_data.user_data(id); NULL для зареєстрованих
  contact_type_id smallint NOT NULL,                      -- FK → mx_dic.dic_contact_type(id)
  contact_value   citext  NOT NULL,                       -- значення (номер/емейл/@username/URL)
  is_default      boolean NOT NULL DEFAULT false,         -- рівно один TRUE на власника

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_contact_user_fk
    FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE,
  CONSTRAINT user_contact_user_data_fk
    FOREIGN KEY (user_data_id) REFERENCES mx_data.user_data(id) ON DELETE CASCADE,
  CONSTRAINT user_contact_type_fk
    FOREIGN KEY (contact_type_id) REFERENCES mx_dic.dic_contact_type(id) ON DELETE RESTRICT,

  -- Обов’язково: або user_id, або user_data_id
  CONSTRAINT user_contact_owner_check
    CHECK (user_id IS NOT NULL OR user_data_id IS NOT NULL)
);

COMMENT ON TABLE mx_data.user_contact IS
‘Контакти користувачів та клієнтів (словникові типи). user_id для зареєстрованих, user_data_id для клієнтів без акаунту. Рівно один is_default=TRUE на власника.’;

-- Індекси
CREATE INDEX IF NOT EXISTS user_contact_user_idx         ON mx_data.user_contact (user_id);
CREATE INDEX IF NOT EXISTS user_contact_user_data_id_idx ON mx_data.user_contact (user_data_id);
CREATE INDEX IF NOT EXISTS user_contact_type_idx         ON mx_data.user_contact (contact_type_id);

-- Partial-UNIQUE: один дефолтний контакт на власника (user_id або user_data_id)
DROP INDEX IF EXISTS mx_data.user_contact_default_one_per_user_idx;
CREATE UNIQUE INDEX IF NOT EXISTS user_contact_default_one_per_user_idx
  ON mx_data.user_contact (COALESCE(user_id, user_data_id::text))
  WHERE is_default = TRUE;
