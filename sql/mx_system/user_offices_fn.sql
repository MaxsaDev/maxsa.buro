-- =========================================================
-- ФУНКЦІЇ ТА ТРИГЕРИ: is_default для mx_system.user_offices
-- =========================================================
-- Забезпечують цілісність: завжди рівно один дефолтний офіс
-- серед призначених офісів користувача.

-- =========================================================
-- ТРИГЕР 1: BEFORE INSERT OR UPDATE OF is_default
-- При INSERT: перший офіс автоматично is_default = true
-- При UPDATE: скидає is_default у всіх інших офісів користувача
-- =========================================================

DROP TRIGGER IF EXISTS trg_user_offices_biu_is_default ON mx_system.user_offices;
DROP FUNCTION IF EXISTS mx_system.fn_user_offices_biu_is_default();

CREATE OR REPLACE FUNCTION mx_system.fn_user_offices_biu_is_default()
    RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Перевіряємо, чи є у користувача вже офіси
        IF (SELECT COUNT(*) FROM mx_system.user_offices WHERE user_id = NEW.user_id) = 0 THEN
            -- Якщо офісів немає, встановлюємо поточний офіс за замовчуванням
            NEW.is_default := TRUE;
        ELSE
            -- Якщо офіси є, скидаємо прапорець за замовчуванням для нового офісу
            NEW.is_default := FALSE;
        END IF;
    ELSIF (TG_OP = 'UPDATE' AND NEW.is_default = TRUE AND OLD.is_default = FALSE) THEN
        -- Оновлюємо прапорець is_default: скидаємо всі інші офіси цього користувача
        UPDATE mx_system.user_offices
        SET is_default = FALSE
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_offices_biu_is_default
    BEFORE INSERT OR UPDATE OF is_default
    ON mx_system.user_offices
    FOR EACH ROW
EXECUTE FUNCTION mx_system.fn_user_offices_biu_is_default();


-- =========================================================
-- ТРИГЕР 2: AFTER DELETE
-- Якщо видалено дефолтний офіс, призначає дефолтним перший
-- з тих, що залишились
-- =========================================================

DROP TRIGGER IF EXISTS trg_user_offices_ad_is_default ON mx_system.user_offices;
DROP FUNCTION IF EXISTS mx_system.fn_user_offices_ad_is_default();

CREATE OR REPLACE FUNCTION mx_system.fn_user_offices_ad_is_default()
    RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_default = TRUE THEN
        -- Якщо видалений офіс був за замовчуванням, призначаємо новий офіс за замовчуванням
        UPDATE mx_system.user_offices
        SET is_default = TRUE
        WHERE id = (
            SELECT id
            FROM mx_system.user_offices
            WHERE user_id = OLD.user_id
            ORDER BY id
            LIMIT 1
        );
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_offices_ad_is_default
    AFTER DELETE
    ON mx_system.user_offices
    FOR EACH ROW
EXECUTE FUNCTION mx_system.fn_user_offices_ad_is_default();
