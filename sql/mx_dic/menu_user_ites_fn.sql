-- =========================================================
-- ФУНКЦІЇ І ТРИГЕРИ ДЛЯ УПРАВЛІННЯ sort_order У ШАБЛОНІ МЕНЮ
-- Таблиця: mx_dic.menu_user_items
-- =========================================================

-- Видаляємо тригери, якщо існують
DROP TRIGGER IF EXISTS trg_menu_user_items_ai_sort_order
    ON mx_dic.menu_user_items;

DROP TRIGGER IF EXISTS trg_menu_user_items_au_sort_order_reorder
    ON mx_dic.menu_user_items;

DROP TRIGGER IF EXISTS trg_menu_user_items_ad_sort_order_reorder
    ON mx_dic.menu_user_items;

-- Видаляємо функції, якщо існують
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_items_ai_sort_order();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_items_au_sort_order_reorder();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_items_ad_sort_order_reorder();

-- =========================================================
-- ФУНКЦІЯ: Призначення sort_order при вставці
-- Якщо sort_order не заданий або = 0, ставимо наступне значення
-- в глобальному списку пунктів меню.
-- =========================================================
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_items_ai_sort_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Якщо порядковий номер не задано або він 0 – ставимо MAX + 1
    IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
        SELECT COALESCE(MAX(sort_order), 0) + 1
        INTO NEW.sort_order
        FROM mx_dic.menu_user_items;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- ФУНКЦІЯ: Перерозподіл sort_order при оновленні
-- Логіка:
--   - якщо sort_order не змінено — нічого не робимо;
--   - якщо елемент рухається «вгору» (NEW < OLD), зсуваємо сусідів вниз (+1);
--   - якщо «вниз» (NEW > OLD), зсуваємо сусідів вгору (-1).
-- Працюємо по всій таблиці (нема категорій).
-- =========================================================
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_items_au_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
    -- Захист від рекурсії: внутрішні UPDATE не запускають перерахунок вдруге
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- Якщо порядковий номер не змінюється — виходимо
    IF NEW.sort_order = OLD.sort_order THEN
        RETURN NEW;
    END IF;

    SET CONSTRAINTS ALL DEFERRED;

    IF NEW.sort_order < OLD.sort_order THEN
        -- Переміщення вгору:
        -- Всі елементи з sort_order у [NEW; OLD) зсуваємо вниз (+1).
        UPDATE mx_dic.menu_user_items
        SET sort_order = sort_order + 1
        WHERE sort_order >= NEW.sort_order
          AND sort_order < OLD.sort_order
          AND id <> NEW.id;
    ELSE
        -- Переміщення вниз:
        -- Всі елементи з sort_order у (OLD; NEW] зсуваємо вгору (-1).
        UPDATE mx_dic.menu_user_items
        SET sort_order = sort_order - 1
        WHERE sort_order <= NEW.sort_order
          AND sort_order > OLD.sort_order
          AND id <> NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =========================================================
-- ФУНКЦІЯ: Перерозподіл sort_order після видалення
-- Ущільнюємо список: всі елементи, що були вище видаленого,
-- зсуваються на 1 вгору (sort_order - 1).
-- =========================================================
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_items_ad_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
    -- Захист від рекурсії на випадок каскадних оновлень
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;

    UPDATE mx_dic.menu_user_items
    SET sort_order = sort_order - 1
    WHERE sort_order > OLD.sort_order;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- ТРИГЕРИ ДЛЯ КЕРУВАННЯ sort_order
-- =========================================================

-- BEFORE INSERT: автоматичне присвоєння sort_order
CREATE TRIGGER trg_menu_user_items_ai_sort_order
    BEFORE INSERT ON mx_dic.menu_user_items
    FOR EACH ROW
    EXECUTE FUNCTION mx_dic.fn_menu_user_items_ai_sort_order();

-- BEFORE UPDATE: при зміні sort_order — перерозподіляємо інші елементи
CREATE TRIGGER trg_menu_user_items_au_sort_order_reorder
    BEFORE UPDATE ON mx_dic.menu_user_items
    FOR EACH ROW
    WHEN (OLD.sort_order IS DISTINCT FROM NEW.sort_order)
    EXECUTE FUNCTION mx_dic.fn_menu_user_items_au_sort_order_reorder();

-- AFTER DELETE: ущільнюємо sort_order
CREATE TRIGGER trg_menu_user_items_ad_sort_order_reorder
    AFTER DELETE ON mx_dic.menu_user_items
    FOR EACH ROW
    EXECUTE FUNCTION mx_dic.fn_menu_user_items_ad_sort_order_reorder();

