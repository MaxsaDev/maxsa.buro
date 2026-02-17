-- =====================================================================
-- ФУНКЦІЯ ТА ТРИГЕР ДЛЯ АВТОМАТИЧНОГО ОНОВЛЕННЯ is_active У ПУНКТАХ ПОВНОВАЖЕНЬ
-- ПРИ ЗМІНІ is_active У КАТЕГОРІЇ ПОВНОВАЖЕНЬ
-- Таблиця: mx_dic.user_permissions_category
-- Логіка:
--   - при деактивації категорії (is_active = false) автоматично деактивуються всі пункти повноважень в цій категорії
--   - при активації категорії (is_active = true) автоматично активуються всі пункти повноважень в цій категорії
-- =====================================================================

-- -------------------------------------------------
-- Видаляємо тригер, якщо існує
-- -------------------------------------------------
DROP TRIGGER IF EXISTS trg_user_permissions_category_au_sync_items_active
  ON mx_dic.user_permissions_category;

-- -------------------------------------------------
-- Видаляємо функцію, якщо існує
-- -------------------------------------------------
DROP FUNCTION IF EXISTS mx_dic.fn_user_permissions_category_au_sync_items_active();

-- =====================================================================
-- ФУНКЦІЯ: Синхронізація is_active пунктів повноважень з категорією
-- =====================================================================
CREATE OR REPLACE FUNCTION mx_dic.fn_user_permissions_category_au_sync_items_active()
RETURNS TRIGGER AS $$
BEGIN
    -- Перевіряємо, чи змінився is_active
    IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
        -- Оновлюємо is_active у всіх пунктах повноважень цієї категорії
        UPDATE mx_dic.user_permissions_items
        SET is_active = NEW.is_active
        WHERE category_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- ТРИГЕР: Викликається після оновлення is_active у категорії
-- =====================================================================
CREATE TRIGGER trg_user_permissions_category_au_sync_items_active
    AFTER UPDATE ON mx_dic.user_permissions_category
    FOR EACH ROW
    WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
    EXECUTE FUNCTION mx_dic.fn_user_permissions_category_au_sync_items_active();
