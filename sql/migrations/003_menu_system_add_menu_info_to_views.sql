-- ======================================================
-- МІГРАЦІЯ 003: Додавання інформації про меню до VIEW
-- ======================================================
-- Ця міграція оновлює VIEW для включення інформації про меню:
-- - menu_id - ID меню
-- - menu_title - назва меню (для відображення в сайдбарі)
-- - menu_sort_order - порядок меню
-- ======================================================

BEGIN;

-- Оновлюємо VIEW для користувача (сайдбар)
DROP VIEW IF EXISTS mx_system.nav_user_sections_user_view CASCADE;

CREATE VIEW mx_system.nav_user_sections_user_view AS
SELECT
    -- Користувач
    u.id                                    AS user_id,               -- ідентифікатор користувача

    -- Меню
    m.id                                    AS menu_id,               -- ідентифікатор меню
    m.title                                 AS menu_title,            -- назва меню (для відображення в сайдбарі)
    m.sort_order                            AS menu_sort_order,       -- порядок меню

    -- Категорія
    c.id                                    AS category_id,           -- ідентифікатор категорії
    c.title                                 AS category_title,        -- назва категорії
    c.url                                   AS category_url,          -- URL категорії
    c.icon                                  AS category_icon,         -- іконка категорії
    c.is_active                             AS category_is_active,    -- глобальна активність категорії

    -- Пункт меню
    i.id                                    AS item_id,               -- ідентифікатор пункту меню
    i.title                                 AS item_title,            -- назва пункту меню
    i.icon                                  AS item_icon,             -- іконка пункту меню
    i.url                                   AS item_url,              -- URL пункту меню
    i.sort_order                            AS item_sort_order,       -- порядок сортування в межах категорії
    i.is_active                             AS item_is_active_global  -- глобальна активність пункту меню
FROM
    mx_system.nav_user_sections nus
    JOIN public."user" u
        ON u.id = nus.user_id
    JOIN mx_dic.menu_user_sections_items i
        ON i.id = nus.menu_id
    JOIN mx_dic.menu_user_sections_category c
        ON c.id = i.category_id
    JOIN mx_dic.menus m
        ON m.id = c.menu_id
WHERE
    -- меню має бути активним
    m.is_active = TRUE
    -- категорія має бути активною
    AND c.is_active = TRUE
    -- пункт меню має бути глобально активним
    AND i.is_active = TRUE
ORDER BY
    u.id,
    m.sort_order,
    m.id,
    c.id,
    i.sort_order,
    i.id;

-- Оновлюємо VIEW для адміністратора
DROP VIEW IF EXISTS mx_system.nav_user_sections_admin_view CASCADE;

CREATE VIEW mx_system.nav_user_sections_admin_view AS
SELECT
    -- Користувач
    u.id                                    AS user_id,               -- ідентифікатор користувача
    u.name                                  AS user_name,             -- ім'я користувача (для відображення в адмінці)

    -- Меню
    m.id                                    AS menu_id,               -- ідентифікатор меню
    m.title                                 AS menu_title,            -- назва меню
    m.sort_order                            AS menu_sort_order,       -- порядок меню

    -- Категорія меню
    c.id                                    AS category_id,           -- ідентифікатор категорії
    c.title                                 AS category_title,        -- назва категорії
    c.url                                   AS category_url,          -- URL категорії
    c.icon                                  AS category_icon,         -- іконка категорії
    c.is_active                             AS category_is_active,    -- глобальна активність категорії

    -- Пункт меню
    i.id                                    AS item_id,               -- ідентифікатор пункту меню
    i.title                                 AS item_title,            -- назва пункту меню
    i.icon                                  AS item_icon,             -- іконка пункту меню
    i.url                                   AS item_url,              -- URL пункту меню
    i.sort_order                            AS item_sort_order,       -- порядок сортування
    i.is_active                             AS item_is_active_global, -- глобальна активність пункту меню

    -- Призначення пункту меню користувачу
    (nus.id IS NOT NULL)                    AS item_is_assigned,      -- чи є запис у nav_user_sections
    (nus.id IS NOT NULL)
        AND i.is_active
        AND c.is_active
        AND m.is_active                     AS item_is_effective_active, -- фактична активність з урахуванням глобальних прапорів

    -- Метадані призначення
    nus.id                                  AS nav_user_section_id,   -- id запису про доступ
    nus.created_at                          AS created_at,            -- коли виданий доступ
    nus.created_by                          AS created_by             -- ким виданий доступ
FROM
    public."user" u
    -- Всі меню для кожного користувача
    CROSS JOIN mx_dic.menus m
    -- Всі категорії для кожного меню
    JOIN mx_dic.menu_user_sections_category c
        ON c.menu_id = m.id
    -- Всі пункти меню для кожної категорії
    JOIN mx_dic.menu_user_sections_items i
        ON i.category_id = c.id
    -- Ліве приєднання прав доступу (може не існувати)
    LEFT JOIN mx_system.nav_user_sections nus
        ON nus.user_id = u.id
       AND nus.menu_id = i.id
ORDER BY
    u.name,
    m.sort_order,
    m.id,
    c.id,
    i.sort_order,
    i.id;

-- Оновлюємо VIEW для пунктів меню користувача (сайдбар)
DROP VIEW IF EXISTS mx_system.nav_user_items_user_view CASCADE;

CREATE VIEW mx_system.nav_user_items_user_view AS
SELECT
    -- Користувач
    u.id                         AS user_id,          -- ідентифікатор користувача

    -- Меню
    m.id                         AS menu_id,          -- ідентифікатор меню
    m.title                      AS menu_title,       -- назва меню (для відображення в сайдбарі)
    m.sort_order                 AS menu_sort_order,  -- порядок меню

    -- Пункт меню
    i.id                         AS item_id,          -- ідентифікатор пункту меню
    i.title                      AS item_title,       -- назва пункту меню
    i.icon                       AS item_icon,        -- іконка пункту меню
    i.url                        AS item_url,         -- URL пункту меню
    i.sort_order                 AS item_sort_order,  -- порядок сортування
    i.is_active                  AS item_is_active_global -- глобальна активність (для діагностики, якщо потрібно)
FROM
    mx_system.nav_user_items nui
    JOIN public."user" u
        ON u.id = nui.user_id
    JOIN mx_dic.menu_user_items i
        ON i.id = nui.menu_id
    JOIN mx_dic.menus m
        ON m.id = i.menu_id
WHERE
    -- меню має бути активним
    m.is_active = TRUE
    -- пункт меню має бути глобально активним
    AND i.is_active = TRUE
ORDER BY
    u.id,
    m.sort_order,
    m.id,
    i.sort_order,
    i.id;

-- Оновлюємо VIEW для адміністратора (пункти меню)
DROP VIEW IF EXISTS mx_system.nav_user_items_admin_view CASCADE;

CREATE VIEW mx_system.nav_user_items_admin_view AS
SELECT
    -- Користувач
    u.id                         AS user_id,               -- ідентифікатор користувача
    u.name                       AS user_name,             -- ім'я користувача (для зручності в адмінці)

    -- Меню
    m.id                         AS menu_id,               -- ідентифікатор меню
    m.title                      AS menu_title,            -- назва меню
    m.sort_order                 AS menu_sort_order,       -- порядок меню

    -- Пункт меню (шаблон)
    i.id                         AS item_id,               -- ідентифікатор пункту меню
    i.title                      AS item_title,           -- назва пункту меню
    i.icon                       AS item_icon,             -- іконка пункту
    i.url                        AS item_url,              -- URL пункту меню
    i.sort_order                 AS item_sort_order,       -- порядок сортування
    i.is_active                  AS item_is_active_global, -- глобальна активність пункту

    -- Призначення пункту меню користувачу
    (nui.id IS NOT NULL)         AS item_is_assigned,      -- чи призначено пункт користувачу
    (nui.id IS NOT NULL)
        AND i.is_active
        AND m.is_active          AS item_is_effective_active, -- фактична активність (призначено + глобально активний)

    -- Метадані призначення
    nui.id                       AS nav_user_item_id,      -- id запису в mx_system.nav_user_items
    nui.created_at               AS created_at,            -- коли призначили
    nui.created_by               AS created_by              -- ким призначили
FROM
    public."user" u
    -- усі меню
    CROSS JOIN mx_dic.menus m
    -- усі пункти меню для кожного меню
    JOIN mx_dic.menu_user_items i
        ON i.menu_id = m.id
    -- ліве приєднання дозволів (можуть бути або не бути)
    LEFT JOIN mx_system.nav_user_items nui
        ON nui.user_id = u.id
       AND nui.menu_id = i.id
ORDER BY
    u.name,
    m.sort_order,
    m.id,
    i.sort_order,
    i.id;

COMMIT;

