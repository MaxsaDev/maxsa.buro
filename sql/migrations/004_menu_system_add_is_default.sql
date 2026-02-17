-- =========================================================
-- МІГРАЦІЯ: Додавання поля is_default для меню за замовчуванням
-- =========================================================
-- Ця міграція додає поле is_default до таблиць пунктів меню,
-- щоб адміністратор міг позначити які пункти меню мають
-- автоматично призначатися новим користувачам при реєстрації

-- Додаємо поле is_default до таблиці пунктів меню з секціями
ALTER TABLE mx_dic.menu_user_sections_items
ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Додаємо поле is_default до таблиці пунктів меню без секцій
ALTER TABLE mx_dic.menu_user_items
ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Створюємо індекси для швидкого пошуку меню за замовчуванням
CREATE INDEX IF NOT EXISTS idx_menu_user_sections_items_is_default
    ON mx_dic.menu_user_sections_items(is_default)
    WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_menu_user_items_is_default
    ON mx_dic.menu_user_items(is_default)
    WHERE is_default = true;

-- Коментарі для документації
COMMENT ON COLUMN mx_dic.menu_user_sections_items.is_default IS
    'Якщо true, пункт меню автоматично призначається новим користувачам при реєстрації та всім існуючим користувачам при встановленні';

COMMENT ON COLUMN mx_dic.menu_user_items.is_default IS
    'Якщо true, пункт меню автоматично призначається новим користувачам при реєстрації та всім існуючим користувачам при встановленні';

-- =========================================================
-- Створення функцій та триггерів для автоматичного призначення
-- меню за замовчуванням всім існуючим користувачам
-- =========================================================

-- Видаляємо тригери, якщо існують
DROP TRIGGER IF EXISTS trg_menu_user_sections_items_au_assign_default
  ON mx_dic.menu_user_sections_items;

DROP TRIGGER IF EXISTS trg_menu_user_items_au_assign_default
  ON mx_dic.menu_user_items;

-- Видаляємо функції, якщо існують
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_sections_items_au_assign_default();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_items_au_assign_default();

-- Функція: Автоматичне призначення меню з секціями всім користувачам
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_sections_items_au_assign_default()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id int;
  v_category_is_active boolean;
  v_menu_id int;
  v_menu_is_active boolean;
  v_system_user_id text;
BEGIN
  -- Перевіряємо чи змінився is_default з false на true
  IF OLD.is_default = false AND NEW.is_default = true THEN
    -- Отримуємо інформацію про категорію та меню для перевірки активності
    SELECT
      c.id,
      c.is_active,
      m.id,
      m.is_active
    INTO
      v_category_id,
      v_category_is_active,
      v_menu_id,
      v_menu_is_active
    FROM mx_dic.menu_user_sections_category c
    INNER JOIN mx_dic.menus m ON m.id = c.menu_id
    WHERE c.id = NEW.category_id;

    -- Отримуємо ID першого адміністратора або першого користувача для created_by
    SELECT id INTO v_system_user_id
    FROM public."user"
    WHERE role = 'admin'
    ORDER BY "createdAt" ASC
    LIMIT 1;

    -- Якщо адміністраторів немає, використовуємо першого користувача
    IF v_system_user_id IS NULL THEN
      SELECT id INTO v_system_user_id
      FROM public."user"
      ORDER BY "createdAt" ASC
      LIMIT 1;
    END IF;

    -- Призначаємо меню тільки якщо пункт меню, категорія та меню активні
    -- та якщо знайдено користувача для created_by
    IF NEW.is_active = true
       AND v_category_is_active = true
       AND v_menu_is_active = true
       AND v_system_user_id IS NOT NULL THEN

      -- Призначаємо пункт меню всім користувачам, які ще не мають його
      -- з is_auto_assigned = true для відстеження автоматичних призначень
      INSERT INTO mx_system.nav_user_sections (user_id, menu_id, created_by, is_auto_assigned)
      SELECT
        u.id,
        NEW.id,
        v_system_user_id, -- ID першого адміністратора або першого користувача
        true -- Позначаємо як автоматично призначене
      FROM public."user" u
      WHERE NOT EXISTS (
        SELECT 1
        FROM mx_system.nav_user_sections nus
        WHERE nus.user_id = u.id
          AND nus.menu_id = NEW.id
      );
    END IF;
  END IF;

  -- Якщо is_default змінився з true на false - видаляємо автоматично призначені меню
  IF OLD.is_default = true AND NEW.is_default = false THEN
    DELETE FROM mx_system.nav_user_sections
    WHERE menu_id = NEW.id
      AND is_auto_assigned = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функція: Автоматичне призначення меню без секцій всім користувачам
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_items_au_assign_default()
RETURNS TRIGGER AS $$
DECLARE
  v_menu_is_active boolean;
  v_system_user_id text;
BEGIN
  -- Перевіряємо чи змінився is_default з false на true
  IF OLD.is_default = false AND NEW.is_default = true THEN
    -- Отримуємо інформацію про меню для перевірки активності
    SELECT is_active
    INTO v_menu_is_active
    FROM mx_dic.menus
    WHERE id = NEW.menu_id;

    -- Отримуємо ID першого адміністратора або першого користувача для created_by
    SELECT id INTO v_system_user_id
    FROM public."user"
    WHERE role = 'admin'
    ORDER BY "createdAt" ASC
    LIMIT 1;

    -- Якщо адміністраторів немає, використовуємо першого користувача
    IF v_system_user_id IS NULL THEN
      SELECT id INTO v_system_user_id
      FROM public."user"
      ORDER BY "createdAt" ASC
      LIMIT 1;
    END IF;

    -- Призначаємо меню тільки якщо пункт меню та меню активні
    -- та якщо знайдено користувача для created_by
    IF NEW.is_active = true
       AND v_menu_is_active = true
       AND v_system_user_id IS NOT NULL THEN

      -- Призначаємо пункт меню всім користувачам, які ще не мають його
      -- з is_auto_assigned = true для відстеження автоматичних призначень
      INSERT INTO mx_system.nav_user_items (user_id, menu_id, created_by, is_auto_assigned)
      SELECT
        u.id,
        NEW.id,
        v_system_user_id, -- ID першого адміністратора або першого користувача
        true -- Позначаємо як автоматично призначене
      FROM public."user" u
      WHERE NOT EXISTS (
        SELECT 1
        FROM mx_system.nav_user_items nui
        WHERE nui.user_id = u.id
          AND nui.menu_id = NEW.id
      );
    END IF;
  END IF;

  -- Якщо is_default змінився з true на false - видаляємо автоматично призначені меню
  IF OLD.is_default = true AND NEW.is_default = false THEN
    DELETE FROM mx_system.nav_user_items
    WHERE menu_id = NEW.id
      AND is_auto_assigned = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригер для меню з секціями
CREATE TRIGGER trg_menu_user_sections_items_au_assign_default
AFTER UPDATE OF is_default ON mx_dic.menu_user_sections_items
FOR EACH ROW
WHEN (OLD.is_default IS DISTINCT FROM NEW.is_default)
EXECUTE FUNCTION mx_dic.fn_menu_user_sections_items_au_assign_default();

-- Тригер для меню без секцій
CREATE TRIGGER trg_menu_user_items_au_assign_default
AFTER UPDATE OF is_default ON mx_dic.menu_user_items
FOR EACH ROW
WHEN (OLD.is_default IS DISTINCT FROM NEW.is_default)
EXECUTE FUNCTION mx_dic.fn_menu_user_items_au_assign_default();

-- Коментарі для документації
COMMENT ON FUNCTION mx_dic.fn_menu_user_sections_items_au_assign_default() IS
    'Автоматично призначає пункт меню з секціями всім існуючим користувачам при встановленні is_default = true';

COMMENT ON FUNCTION mx_dic.fn_menu_user_items_au_assign_default() IS
    'Автоматично призначає пункт меню без секцій всім існуючим користувачам при встановленні is_default = true';

