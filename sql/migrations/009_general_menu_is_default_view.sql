-- ============================================================
-- МІГРАЦІЯ 009: is_default для загального меню
-- Оновлює nav_user_general_user_view так, щоб пункти з
-- is_default = true були видні всім активним користувачам
-- без потреби явного призначення.
-- ============================================================

BEGIN;

-- Перестворюємо user_view з підтримкою is_default
DROP VIEW IF EXISTS mx_system.nav_user_general_user_view CASCADE;

CREATE VIEW mx_system.nav_user_general_user_view AS
SELECT DISTINCT ON (u.id, i.id)
    u.id                                    AS user_id,

    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global
FROM
    public."user" u
    CROSS JOIN mx_dic.menu_general_items i
    JOIN mx_dic.menus m
        ON m.id = i.menu_id
WHERE
    m.is_active = TRUE
    AND i.is_active = TRUE
    AND (
        -- Явно призначено цьому користувачу
        EXISTS (
            SELECT 1 FROM mx_system.nav_user_general nug
            WHERE nug.user_id = u.id AND nug.menu_id = i.id
        )
        OR
        -- Або позначено як загальнодоступне (для всіх)
        i.is_default = TRUE
    )
ORDER BY
    u.id,
    i.id,
    m.sort_order,
    m.id,
    i.sort_order;

COMMIT;
