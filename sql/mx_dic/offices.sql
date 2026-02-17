CREATE SCHEMA IF NOT EXISTS mx_dic;

-- ======================================================
-- ТАБЛИЦЯ ФІЛІЙ / ОФІСІВ КОМПАНІЇ
-- ======================================================
DROP TABLE IF EXISTS mx_dic.offices CASCADE;

CREATE TABLE IF NOT EXISTS mx_dic.offices (
  id           SERIAL PRIMARY KEY,                    -- унікальний ідентифікатор офісу
  title        text        NOT NULL,                   -- назва філії / офісу
  city         text,                                   -- місто
  address      text,                                   -- адреса
  phone        text,                                   -- телефон
  email        text,                                   -- електронна пошта
  link_map     text,                                   -- посилання на карту (Google Maps тощо)
  latitude     numeric(10, 7),                         -- широта (координати)
  longitude    numeric(10, 7),                         -- довгота (координати)
  zip          text,                                   -- поштовий індекс
  sort_order   int         NOT NULL DEFAULT 100,       -- порядок відображення офісів
  is_active    boolean     NOT NULL DEFAULT TRUE,      -- активність офісу
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE mx_dic.offices IS
'Філії, представництва або офіси як підрозділи компанії.';

-- Індекси для швидкого сортування та фільтрації
CREATE INDEX IF NOT EXISTS idx_offices_sort_order ON mx_dic.offices(sort_order);
CREATE INDEX IF NOT EXISTS idx_offices_is_active ON mx_dic.offices(is_active);
CREATE INDEX IF NOT EXISTS idx_offices_city ON mx_dic.offices(city);
