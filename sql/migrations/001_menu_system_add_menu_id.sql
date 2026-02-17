-- ======================================================
-- МІГРАЦІЯ 001: Додавання поля menu_id до існуючих таблиць меню
-- ======================================================
-- Ця міграція додає поле menu_id до таблиць:
-- - mx_dic.menu_user_sections_category
-- - mx_dic.menu_user_items
-- - mx_dic.menu_app_support
--
-- Після виконання міграції потрібно буде виконати міграцію даних
-- (002_menu_system_migrate_existing_data.sql) для заповнення menu_id
-- ======================================================

BEGIN;

-- Додаємо menu_id до таблиці категорій меню з секціями
ALTER TABLE mx_dic.menu_user_sections_category
  ADD COLUMN IF NOT EXISTS menu_id int;

-- Додаємо menu_id до таблиці пунктів меню користувача
ALTER TABLE mx_dic.menu_user_items
  ADD COLUMN IF NOT EXISTS menu_id int;

-- Додаємо menu_id до таблиці меню підтримки
ALTER TABLE mx_dic.menu_app_support
  ADD COLUMN IF NOT EXISTS menu_id int;

COMMIT;

