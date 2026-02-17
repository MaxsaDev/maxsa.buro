-- =========================================================
-- МІГРАЦІЯ: Додавання поля is_auto_assigned для відстеження
-- автоматично призначених меню за замовчуванням
-- =========================================================
-- Ця міграція додає поле is_auto_assigned до таблиць призначення меню,
-- щоб можна було відстежити які меню були призначені автоматично
-- і видалити їх при знятті is_default = false

-- Додаємо поле is_auto_assigned до таблиці призначення меню з секціями
ALTER TABLE mx_system.nav_user_sections
ADD COLUMN IF NOT EXISTS is_auto_assigned boolean NOT NULL DEFAULT false;

-- Додаємо поле is_auto_assigned до таблиці призначення меню без секцій
ALTER TABLE mx_system.nav_user_items
ADD COLUMN IF NOT EXISTS is_auto_assigned boolean NOT NULL DEFAULT false;

-- Створюємо індекси для швидкого пошуку автоматично призначених меню
CREATE INDEX IF NOT EXISTS idx_nav_user_sections_is_auto_assigned
    ON mx_system.nav_user_sections(is_auto_assigned, menu_id)
    WHERE is_auto_assigned = true;

CREATE INDEX IF NOT EXISTS idx_nav_user_items_is_auto_assigned
    ON mx_system.nav_user_items(is_auto_assigned, menu_id)
    WHERE is_auto_assigned = true;

-- Коментарі для документації
COMMENT ON COLUMN mx_system.nav_user_sections.is_auto_assigned IS
    'Якщо true, меню було призначено автоматично через тригер при встановленні is_default = true. Такі меню будуть автоматично видалені при знятті is_default = false';

COMMENT ON COLUMN mx_system.nav_user_items.is_auto_assigned IS
    'Якщо true, меню було призначено автоматично через тригер при встановленні is_default = true. Такі меню будуть автоматично видалені при знятті is_default = false';

-- Оновлюємо функції тригерів для встановлення is_auto_assigned = true
-- та додаємо логіку видалення при знятті is_default = false

-- Функція для меню з секціями
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_sections_items_au_assign_default()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id int;
  v_category_is_active boolean;
  v_menu_id int;
  v_menu_is_active boolean;
  v_system_user_id text;
BEGIN
  -- Якщо is_default змінився з false на true - призначаємо меню всім користувачам
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

    IF v_system_user_id IS NULL THEN
      SELECT id INTO v_system_user_id
      FROM public."user"
      ORDER BY "createdAt" ASC
      LIMIT 1;
    END IF;

    IF NEW.is_active = true
       AND v_category_is_active = true
       AND v_menu_is_active = true
       AND v_system_user_id IS NOT NULL THEN

      -- Призначаємо пункт меню всім користувачам з is_auto_assigned = true
      INSERT INTO mx_system.nav_user_sections (user_id, menu_id, created_by, is_auto_assigned)
      SELECT
        u.id,
        NEW.id,
        v_system_user_id,
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

-- Функція для меню без секцій
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_items_au_assign_default()
RETURNS TRIGGER AS $$
DECLARE
  v_menu_is_active boolean;
  v_system_user_id text;
BEGIN
  -- Якщо is_default змінився з false на true - призначаємо меню всім користувачам
  IF OLD.is_default = false AND NEW.is_default = true THEN
    SELECT is_active
    INTO v_menu_is_active
    FROM mx_dic.menus
    WHERE id = NEW.menu_id;

    SELECT id INTO v_system_user_id
    FROM public."user"
    WHERE role = 'admin'
    ORDER BY "createdAt" ASC
    LIMIT 1;

    IF v_system_user_id IS NULL THEN
      SELECT id INTO v_system_user_id
      FROM public."user"
      ORDER BY "createdAt" ASC
      LIMIT 1;
    END IF;

    IF NEW.is_active = true
       AND v_menu_is_active = true
       AND v_system_user_id IS NOT NULL THEN

      -- Призначаємо пункт меню всім користувачам з is_auto_assigned = true
      INSERT INTO mx_system.nav_user_items (user_id, menu_id, created_by, is_auto_assigned)
      SELECT
        u.id,
        NEW.id,
        v_system_user_id,
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

