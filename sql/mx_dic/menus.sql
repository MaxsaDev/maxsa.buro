CREATE SCHEMA IF NOT EXISTS mx_dic;

-- ======================================================
-- ТАБЛИЦЯ МЕНЮ ПРИЛОЖЕННЯ
-- ======================================================
DROP TABLE IF EXISTS mx_dic.menus CASCADE;

CREATE TABLE IF NOT EXISTS mx_dic.menus (
  id           SERIAL PRIMARY KEY,                    -- унікальний ідентифікатор меню
  title        text        NOT NULL,                   -- назва меню (видно над пунктами)
  menu_type_id smallint    NOT NULL,                   -- FK на тип меню (sections або items)
  sort_order   int         NOT NULL DEFAULT 100,      -- порядок відображення меню
  is_active    boolean     NOT NULL DEFAULT TRUE,     -- активність меню
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT menus_fk_menu_type
    FOREIGN KEY (menu_type_id)
    REFERENCES mx_dic.menu_types(id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE mx_dic.menus IS
'Меню приложения. Адміністратор може створювати кілька меню різних типів та ранжувати їх.';

-- Індекс для швидкого сортування
CREATE INDEX IF NOT EXISTS idx_menus_sort_order ON mx_dic.menus(sort_order);
CREATE INDEX IF NOT EXISTS idx_menus_menu_type_id ON mx_dic.menus(menu_type_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON mx_dic.menus(is_active);

