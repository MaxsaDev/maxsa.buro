-- ======================================================
-- МІГРАЦІЯ 002: Міграція існуючих даних до нової структури меню
-- ======================================================
-- Ця міграція:
-- 1. Створює перше меню для кожного типу (sections, items)
-- 2. Призначає існуючі дані до цих меню
-- 3. Додає зовнішні ключі з обмеженнями
-- ======================================================

BEGIN;

-- Створюємо перше меню з секціями
INSERT INTO mx_dic.menus (title, menu_type_id, sort_order, is_active)
SELECT 'Меню користувача з секціями', id, 10, true
FROM mx_dic.menu_types
WHERE code = 'sections'
ON CONFLICT DO NOTHING;

-- Створюємо перше меню з пунктами
INSERT INTO mx_dic.menus (title, menu_type_id, sort_order, is_active)
SELECT 'Меню користувача з пунктами', id, 20, true
FROM mx_dic.menu_types
WHERE code = 'items'
ON CONFLICT DO NOTHING;

-- Створюємо перше меню підтримки (тип items)
INSERT INTO mx_dic.menus (title, menu_type_id, sort_order, is_active)
SELECT 'Меню підтримки додатку', id, 30, true
FROM mx_dic.menu_types
WHERE code = 'items'
ON CONFLICT DO NOTHING;

-- Отримуємо ID створених меню
DO $$
DECLARE
  v_menu_sections_id int;
  v_menu_items_id int;
  v_menu_support_id int;
BEGIN
  -- Отримуємо ID меню з секціями
  SELECT id INTO v_menu_sections_id
  FROM mx_dic.menus
  WHERE menu_type_id = (SELECT id FROM mx_dic.menu_types WHERE code = 'sections')
  ORDER BY id ASC
  LIMIT 1;

  -- Отримуємо ID меню з пунктами
  SELECT id INTO v_menu_items_id
  FROM mx_dic.menus
  WHERE menu_type_id = (SELECT id FROM mx_dic.menu_types WHERE code = 'items')
  ORDER BY id ASC
  LIMIT 1;

  -- Отримуємо ID меню підтримки (за назвою або sort_order)
  SELECT id INTO v_menu_support_id
  FROM mx_dic.menus
  WHERE title = 'Меню підтримки додатку'
    AND menu_type_id = (SELECT id FROM mx_dic.menu_types WHERE code = 'items')
  ORDER BY id ASC
  LIMIT 1;

  -- Призначаємо всі існуючі категорії до першого меню з секціями
  UPDATE mx_dic.menu_user_sections_category
  SET menu_id = v_menu_sections_id
  WHERE menu_id IS NULL;

  -- Призначаємо всі існуючі пункти до першого меню з пунктами
  UPDATE mx_dic.menu_user_items
  SET menu_id = v_menu_items_id
  WHERE menu_id IS NULL;

  -- Призначаємо всі існуючі пункти підтримки до меню підтримки
  UPDATE mx_dic.menu_app_support
  SET menu_id = v_menu_support_id
  WHERE menu_id IS NULL;
END $$;

-- Додаємо обмеження NOT NULL після заповнення даних
ALTER TABLE mx_dic.menu_user_sections_category
  ALTER COLUMN menu_id SET NOT NULL;

ALTER TABLE mx_dic.menu_user_items
  ALTER COLUMN menu_id SET NOT NULL;

ALTER TABLE mx_dic.menu_app_support
  ALTER COLUMN menu_id SET NOT NULL;

-- Додаємо зовнішні ключі
ALTER TABLE mx_dic.menu_user_sections_category
  ADD CONSTRAINT menu_user_sections_category_fk_menu
    FOREIGN KEY (menu_id)
    REFERENCES mx_dic.menus(id)
    ON DELETE CASCADE;

ALTER TABLE mx_dic.menu_user_items
  ADD CONSTRAINT menu_user_items_fk_menu
    FOREIGN KEY (menu_id)
    REFERENCES mx_dic.menus(id)
    ON DELETE CASCADE;

ALTER TABLE mx_dic.menu_app_support
  ADD CONSTRAINT menu_app_support_fk_menu
    FOREIGN KEY (menu_id)
    REFERENCES mx_dic.menus(id)
    ON DELETE CASCADE;

-- Додаємо індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_menu_user_sections_category_menu_id
  ON mx_dic.menu_user_sections_category(menu_id);

CREATE INDEX IF NOT EXISTS idx_menu_user_items_menu_id
  ON mx_dic.menu_user_items(menu_id);

CREATE INDEX IF NOT EXISTS idx_menu_app_support_menu_id
  ON mx_dic.menu_app_support(menu_id);

COMMIT;

