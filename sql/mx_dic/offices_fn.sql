-- =====================================================================
-- ФУНКЦІЇ ТА ТРИГЕРИ ДЛЯ УПРАВЛІННЯ sort_order У ТАБЛИЦІ ОФІСІВ
-- Таблиця: mx_dic.offices
-- Логіка:
--   - автоприсвоєння sort_order при INSERT
--   - перерозподіл sort_order при UPDATE (drag&drop для ранжування офісів)
--   - ущільнення sort_order після DELETE
--   - автоматичне оновлення updated_at при UPDATE
-- =====================================================================

-- -------------------------------------------------
-- Видаляємо тригери, якщо існують
-- -------------------------------------------------
DROP TRIGGER IF EXISTS trg_offices_bi_sort_order
  ON mx_dic.offices;

DROP TRIGGER IF EXISTS trg_offices_bu_sort_order_reorder
  ON mx_dic.offices;

DROP TRIGGER IF EXISTS trg_offices_ad_sort_order_reorder
  ON mx_dic.offices;

DROP TRIGGER IF EXISTS trg_offices_bu_set_updated_at
  ON mx_dic.offices;

-- -------------------------------------------------
-- Видаляємо функції, якщо існують
-- -------------------------------------------------
DROP FUNCTION IF EXISTS mx_dic.fn_offices_bi_sort_order();
DROP FUNCTION IF EXISTS mx_dic.fn_offices_bu_sort_order_reorder();
DROP FUNCTION IF EXISTS mx_dic.fn_offices_ad_sort_order_reorder();



-- =====================================================================
-- 1. BEFORE INSERT: автоматичне присвоєння sort_order
-- =====================================================================
CREATE OR REPLACE FUNCTION mx_dic.fn_offices_bi_sort_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Якщо sort_order не переданий або = 0, ставимо наступний порядковий
    -- номер в глобальному списку офісів.
    IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
        SELECT COALESCE(MAX(sort_order), 0) + 100
        INTO NEW.sort_order
        FROM mx_dic.offices;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- =====================================================================
-- 2. BEFORE UPDATE: перерозподіл sort_order при зміні
--    (drag&drop для ранжування офісів між собою)
-- =====================================================================
CREATE OR REPLACE FUNCTION mx_dic.fn_offices_bu_sort_order_reorder()
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

    -- Відкладаємо перевірку обмежень (на випадок унікальних індексів)
    SET CONSTRAINTS ALL DEFERRED;

    IF NEW.sort_order < OLD.sort_order THEN
        -- Переміщення "вгору":
        -- Елементи між NEW.sort_order і OLD.sort_order зсуваємо вниз (+100).
        UPDATE mx_dic.offices
        SET sort_order = sort_order + 100
        WHERE sort_order >= NEW.sort_order
          AND sort_order < OLD.sort_order
          AND id <> NEW.id;
    ELSE
        -- Переміщення "вниз":
        -- Елементи між OLD.sort_order і NEW.sort_order зсуваємо вгору (-100).
        UPDATE mx_dic.offices
        SET sort_order = sort_order - 100
        WHERE sort_order <= NEW.sort_order
          AND sort_order > OLD.sort_order
          AND id <> NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- =====================================================================
-- 3. AFTER DELETE: ущільнення sort_order після видалення
-- =====================================================================
CREATE OR REPLACE FUNCTION mx_dic.fn_offices_ad_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
    -- Захист від рекурсії: при наступних UPDATE тих самих рядків
    -- (через BEFORE UPDATE-тригер) не запускаємо повторний перерахунок.
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;

    -- Ущільнюємо порядок:
    -- всі офіси з більшим sort_order зсуваємо на 100 вгору.
    UPDATE mx_dic.offices
    SET sort_order = sort_order - 100
    WHERE sort_order > OLD.sort_order;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;



-- =====================================================================
-- 4. ТРИГЕРИ
-- =====================================================================

-- BEFORE INSERT: автоматичне присвоєння sort_order
CREATE TRIGGER trg_offices_bi_sort_order
    BEFORE INSERT ON mx_dic.offices
    FOR EACH ROW
    EXECUTE FUNCTION mx_dic.fn_offices_bi_sort_order();

-- BEFORE UPDATE: якщо змінився sort_order — перерозподіляємо індекси
CREATE TRIGGER trg_offices_bu_sort_order_reorder
    BEFORE UPDATE ON mx_dic.offices
    FOR EACH ROW
    WHEN (OLD.sort_order IS DISTINCT FROM NEW.sort_order)
    EXECUTE FUNCTION mx_dic.fn_offices_bu_sort_order_reorder();

-- AFTER DELETE: ущільнюємо sort_order
CREATE TRIGGER trg_offices_ad_sort_order_reorder
    AFTER DELETE ON mx_dic.offices
    FOR EACH ROW
    EXECUTE FUNCTION mx_dic.fn_offices_ad_sort_order_reorder();

-- BEFORE UPDATE: автоматичне оновлення updated_at
CREATE TRIGGER trg_offices_bu_set_updated_at
    BEFORE UPDATE ON mx_dic.offices
    FOR EACH ROW
    EXECUTE FUNCTION mx_global.set_updated_at();
