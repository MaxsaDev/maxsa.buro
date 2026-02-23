-- ============================================================
-- МІГРАЦІЯ 010: is_default для офісного меню — всі офіси
-- Оновлює nav_user_items_user_view та nav_user_sections_user_view
-- так, щоб пункти з is_default = true були видні в усіх офісах
-- користувача, без потреби явного призначення для кожного офісу.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. nav_user_items_user_view
-- ============================================================
DROP VIEW IF EXISTS mx_system.nav_user_items_user_view CASCADE;

CREATE VIEW mx_system.nav_user_items_user_view AS
SELECT DISTINCT ON (u.id, i.id)
    u.id                         AS user_id,
    uo.office_id                 AS office_id,
    m.id                         AS menu_id,
    m.title                      AS menu_title,
    m.sort_order                 AS menu_sort_order,
    i.id                         AS item_id,
    i.title                      AS item_title,
    i.icon                       AS item_icon,
    i.url                        AS item_url,
    i.sort_order                 AS item_sort_order,
    i.is_active                  AS item_is_active_global
FROM
    public."user" u
    JOIN mx_system.user_offices uo
        ON uo.user_id = u.id
       AND uo.is_default = TRUE
    CROSS JOIN mx_dic.menu_user_items i
    JOIN mx_dic.menus m
        ON m.id = i.menu_id
WHERE
    m.is_active = TRUE
    AND i.is_active = TRUE
    AND (
        EXISTS (
            SELECT 1 FROM mx_system.nav_user_items nui
            WHERE nui.user_id = u.id
              AND nui.menu_id = i.id
              AND nui.office_id = uo.office_id
        )
        OR i.is_default = TRUE
    )
ORDER BY
    u.id,
    i.id,
    m.sort_order,
    m.id,
    i.sort_order;

-- ============================================================
-- 2. nav_user_sections_user_view
-- ============================================================
DROP VIEW IF EXISTS mx_system.nav_user_sections_user_view CASCADE;

CREATE VIEW mx_system.nav_user_sections_user_view AS
SELECT DISTINCT ON (u.id, i.id)
    u.id                                    AS user_id,
    uo.office_id                            AS office_id,
    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,
    c.id                                    AS category_id,
    c.title                                 AS category_title,
    c.url                                   AS category_url,
    c.icon                                  AS category_icon,
    c.is_active                             AS category_is_active,
    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global
FROM
    public."user" u
    JOIN mx_system.user_offices uo
        ON uo.user_id = u.id
       AND uo.is_default = TRUE
    CROSS JOIN mx_dic.menu_user_sections_items i
    JOIN mx_dic.menu_user_sections_category c
        ON c.id = i.category_id
    JOIN mx_dic.menus m
        ON m.id = c.menu_id
WHERE
    m.is_active = TRUE
    AND c.is_active = TRUE
    AND i.is_active = TRUE
    AND (
        EXISTS (
            SELECT 1 FROM mx_system.nav_user_sections nus
            WHERE nus.user_id = u.id
              AND nus.menu_id = i.id
              AND nus.office_id = uo.office_id
        )
        OR i.is_default = TRUE
    )
ORDER BY
    u.id,
    i.id,
    m.sort_order,
    m.id,
    c.id,
    i.sort_order;

COMMIT;
