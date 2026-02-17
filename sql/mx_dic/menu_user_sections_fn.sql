-- =====================================================================
-- ФУНКЦІЇ ТА ТРИГЕРИ ДЛЯ УПРАВЛІННЯ sort_order У ПУНКТАХ МЕНЮ
-- Таблиця: mx_dic.menu_user_sections_items
-- Логіка:
--   - автоприсвоєння sort_order при INSERT (в межах category_id)
--   - перерозподіл sort_order при UPDATE (drag&drop в межах category_id)
--   - ущільнення sort_order після DELETE (в межах category_id)
-- =====================================================================

-- -------------------------------------------------
-- Видаляємо тригери, якщо існують
-- -------------------------------------------------
DROP TRIGGER IF EXISTS trg_menu_user_sections_items_bi_sort_order
  ON mx_dic.menu_user_sections_items;

DROP TRIGGER IF EXISTS trg_menu_user_sections_items_bu_sort_order_reorder
  ON mx_dic.menu_user_sections_items;

DROP TRIGGER IF EXISTS trg_menu_user_sections_items_ad_sort_order_reorder
  ON mx_dic.menu_user_sections_items;

-- -------------------------------------------------
-- Видаляємо функції, якщо існують
-- -------------------------------------------------
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_sections_items_bi_sort_order();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_sections_items_bu_sort_order_reorder();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_sections_items_ad_sort_order_reorder();



-- =====================================================================
-- 1. BEFORE INSERT: автоматичне присвоєння sort_order
-- =====================================================================
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_sections_items_bi_sort_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Якщо sort_order не переданий або = 0, ставимо наступний порядковий
    -- номер в межах поточної категорії.
    IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
        SELECT COALESCE(MAX(sort_order), 0) + 1
        INTO NEW.sort_order
        FROM mx_dic.menu_user_sections_items
        WHERE category_id = NEW.category_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- =====================================================================
-- 2. BEFORE UPDATE: перерозподіл sort_order при зміні
--    (drag&drop в межах однієї category_id)
-- =====================================================================
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_sections_items_bu_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
    -- Захист від рекурсії: при внутрішніх UPDATE, викликаних самим тригером,
    -- не запускаємо перерахунок повторно.
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- Якщо порядковий номер не змінився — нічого не робимо.
    IF NEW.sort_order = OLD.sort_order THEN
        RETURN NEW;
    END IF;

    -- Працюємо тільки в межах однієї категорії.
    -- Якщо ти потім захочеш дозволити "міграцію" між категоріями з
    -- автоматичним перерахунком — це можна буде розширити окремо.
    IF NEW.category_id <> OLD.category_id THEN
        RETURN NEW;
    END IF;

    -- Відкладаємо перевірку обмежень (на випадок унікальних індексів)
    SET CONSTRAINTS ALL DEFERRED;

    IF NEW.sort_order < OLD.sort_order THEN
        -- Переміщення "вгору":
        -- Елементи між NEW.sort_order і OLD.sort_order зсуваємо вниз (+1).
        UPDATE mx_dic.menu_user_sections_items
        SET sort_order = sort_order + 1
        WHERE category_id = NEW.category_id
          AND sort_order >= NEW.sort_order
          AND sort_order < OLD.sort_order
          AND id <> NEW.id;
    ELSE
        -- Переміщення "вниз":
        -- Елементи між OLD.sort_order і NEW.sort_order зсуваємо вгору (-1).
        UPDATE mx_dic.menu_user_sections_items
        SET sort_order = sort_order - 1
        WHERE category_id = NEW.category_id
          AND sort_order <= NEW.sort_order
          AND sort_order > OLD.sort_order
          AND id <> NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- =====================================================================
-- 3. AFTER DELETE: ущільнення sort_order після видалення
-- =====================================================================
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_sections_items_ad_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
    -- Захист від рекурсії: при наступних UPDATE тих самих рядків
    -- (через BEFORE UPDATE-тригер) не запускаємо повторний перерахунок.
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;

    -- Ущільнюємо порядок у межах категорії:
    -- всі елементи з більшим sort_order зсуваємо на 1 вгору.
    UPDATE mx_dic.menu_user_sections_items
    SET sort_order = sort_order - 1
    WHERE category_id = OLD.category_id
      AND sort_order > OLD.sort_order;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;



-- =====================================================================
-- 4. ТРИГЕРИ
-- =====================================================================

-- BEFORE INSERT: автоматичне присвоєння sort_order
CREATE TRIGGER trg_menu_user_sections_items_bi_sort_order
    BEFORE INSERT ON mx_dic.menu_user_sections_items
    FOR EACH ROW
    EXECUTE FUNCTION mx_dic.fn_menu_user_sections_items_bi_sort_order();

-- BEFORE UPDATE: якщо змінився sort_order — перерозподіляємо індекси
CREATE TRIGGER trg_menu_user_sections_items_bu_sort_order_reorder
    BEFORE UPDATE ON mx_dic.menu_user_sections_items
    FOR EACH ROW
    WHEN (OLD.sort_order IS DISTINCT FROM NEW.sort_order)
    EXECUTE FUNCTION mx_dic.fn_menu_user_sections_items_bu_sort_order_reorder();

-- AFTER DELETE: ущільнюємо sort_order у категорії
CREATE TRIGGER trg_menu_user_sections_items_ad_sort_order_reorder
    AFTER DELETE ON mx_dic.menu_user_sections_items
    FOR EACH ROW
    EXECUTE FUNCTION mx_dic.fn_menu_user_sections_items_ad_sort_order_reorder();
