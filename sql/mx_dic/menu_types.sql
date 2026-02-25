CREATE SCHEMA IF NOT EXISTS mx_dic;

-- ======================================================
-- СЛОВНИК ТИПІВ МЕНЮ
-- ======================================================
DROP TABLE IF EXISTS mx_dic.menu_types CASCADE;

CREATE TABLE IF NOT EXISTS mx_dic.menu_types (
  id          smallserial PRIMARY KEY,           -- компактний FK
  code        text NOT NULL UNIQUE,              -- машинний код: 'sections', 'items'
  title       text NOT NULL,                     -- локалізована назва (українська)
  sort_order  int  NOT NULL DEFAULT 100,         -- порядок у селектах
  is_active   boolean NOT NULL DEFAULT true,     -- м'яка деактивація без видалення
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE mx_dic.menu_types IS
'Словник типів меню: sections (з секціями та пунктами), items (тільки пункти), general (загальне — без офісу).';

-- Початкове наповнення (ідемпотентне)
INSERT INTO mx_dic.menu_types (code, title, sort_order) VALUES
 ('sections', 'Меню з секціями та пунктами', 10),
 ('items',    'Меню з пунктами',              20),
 ('general',  'Загальне меню (без офісу)',    30)
ON CONFLICT (code) DO NOTHING;

