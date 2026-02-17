CREATE SCHEMA IF NOT EXISTS mx_system;

-- =========================================================
-- ДОЗВОЛИ НА ПУНКТИ МЕНЮ ДЛЯ КОРИСТУВАЧІВ
-- =========================================================
DROP TABLE IF EXISTS mx_system.nav_user_items CASCADE;

CREATE TABLE IF NOT EXISTS mx_system.nav_user_items
(
    id         SERIAL      NOT NULL PRIMARY KEY, -- технічний ідентифікатор запису дозволу
    user_id    text        NOT NULL,             -- ідентифікатор користувача (Better Auth, тип text)
    menu_id    int         NOT NULL,             -- FK на mx_dic.menu_user_items.id
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, -- коли видали доступ
    created_by text        NOT NULL,             -- хто видав доступ (id користувача-адміністратора)
    is_auto_assigned boolean NOT NULL DEFAULT false, -- чи було призначено автоматично через тригер

    CONSTRAINT nav_user_items_fk_user
        FOREIGN KEY (user_id)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    CONSTRAINT nav_user_items_fk_created_by
        FOREIGN KEY (created_by)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    CONSTRAINT nav_user_items_fk_menu_item
        FOREIGN KEY (menu_id)
        REFERENCES mx_dic.menu_user_items(id)
        ON DELETE CASCADE,

    -- один і той самий пункт меню не може бути призначений одному користувачу двічі
    CONSTRAINT nav_user_items_user_menu_unique
        UNIQUE (user_id, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_nav_user_items_is_auto_assigned
    ON mx_system.nav_user_items(is_auto_assigned, menu_id)
    WHERE is_auto_assigned = true;

COMMENT ON COLUMN mx_system.nav_user_items.is_auto_assigned IS
    'Якщо true, меню було призначено автоматично через тригер при встановленні is_default = true. Такі меню будуть автоматично видалені при знятті is_default = false';

-- =========================================================
-- VIEW: АДМІНІСТРАТОР — ПОВНИЙ ОГЛЯД ПРАВ НА ПУНКТИ МЕНЮ
-- Таблиця-джерело: mx_dic.menu_user_items, mx_system.nav_user_items, public."user"
-- =========================================================
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


-- =========================================================
-- VIEW: МЕНЮ КОНКРЕТНОГО КОРИСТУВАЧА (ДЛЯ САЙДБАРУ)
-- Показує тільки дозволені й глобально активні пункти меню
-- =========================================================
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
