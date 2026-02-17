-- =========================================================
-- МІГРАЦІЯ: Додавання поля is_default до mx_system.user_offices
-- =========================================================
-- Дозволяє визначити один офіс як "за замовчуванням" для кожного
-- користувача. Тригери забезпечують цілісність: завжди рівно один
-- дефолтний офіс серед призначених.

-- Додаємо поле is_default
ALTER TABLE mx_system.user_offices
ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

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

-- =========================================================
-- ОНОВЛЕННЯ VIEW: user_offices_admin_view
-- =========================================================

CREATE OR REPLACE VIEW mx_system.user_offices_admin_view AS
SELECT
    u.id                                    AS user_id,
    u.name                                  AS user_name,
    o.id                                    AS office_id,
    o.title                                 AS office_title,
    o.city                                  AS office_city,
    o.is_active                             AS office_is_active,
    o.sort_order                            AS office_sort_order,
    (uo.id IS NOT NULL)                     AS office_is_assigned,
    (uo.id IS NOT NULL)
        AND o.is_active                     AS office_is_effective_active,
    COALESCE(uo.is_default, FALSE)          AS office_is_default,
    uo.id                                   AS user_office_id,
    uo.created_at                           AS created_at,
    uo.created_by                           AS created_by
FROM
    public."user" u
    CROSS JOIN mx_dic.offices o
    LEFT JOIN mx_system.user_offices uo
        ON uo.user_id = u.id
       AND uo.office_id = o.id
ORDER BY
    u.name,
    o.sort_order,
    o.id;

-- =========================================================
-- ОНОВЛЕННЯ VIEW: user_offices_user_view
-- =========================================================

CREATE OR REPLACE VIEW mx_system.user_offices_user_view AS
SELECT
    u.id                                    AS user_id,
    o.id                                    AS office_id,
    o.title                                 AS office_title,
    o.city                                  AS office_city,
    o.address                               AS office_address,
    o.phone                                 AS office_phone,
    o.email                                 AS office_email,
    uo.is_default                           AS office_is_default
FROM
    mx_system.user_offices uo
    JOIN public."user" u
        ON u.id = uo.user_id
    JOIN mx_dic.offices o
        ON o.id = uo.office_id
WHERE
    o.is_active = TRUE
ORDER BY
    uo.is_default DESC,
    u.id,
    o.sort_order,
    o.id;
