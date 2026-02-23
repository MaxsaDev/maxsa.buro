CREATE SCHEMA IF NOT EXISTS mx_system;

-- =========================================================
-- ДОЗВОЛИ НА ПУНКТИ МЕНЮ ДЛЯ КОРИСТУВАЧІВ З ПРИВ'ЯЗКОЮ ДО ОФІСУ
-- =========================================================
DROP TABLE IF EXISTS mx_system.nav_user_items CASCADE;

CREATE TABLE IF NOT EXISTS mx_system.nav_user_items
(
    id               SERIAL      NOT NULL PRIMARY KEY,
    user_id          text        NOT NULL,             -- ідентифікатор користувача (Better Auth, тип text)
    menu_id          int         NOT NULL,             -- FK на mx_dic.menu_user_items.id
    office_id        int         NOT NULL,             -- FK на mx_dic.offices.id
    created_at       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       text        NOT NULL,             -- хто видав доступ (id адміністратора)
    is_auto_assigned boolean     NOT NULL DEFAULT false,

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

    CONSTRAINT nav_user_items_fk_office
        FOREIGN KEY (office_id)
        REFERENCES mx_dic.offices(id)
        ON DELETE CASCADE,

    -- Один пункт меню не може бути призначений одному користувачу в одному офісі двічі
    CONSTRAINT nav_user_items_user_menu_office_unique
        UNIQUE (user_id, menu_id, office_id)
);

CREATE INDEX IF NOT EXISTS idx_nav_user_items_is_auto_assigned
    ON mx_system.nav_user_items(is_auto_assigned, menu_id)
    WHERE is_auto_assigned = true;

CREATE INDEX IF NOT EXISTS idx_nav_user_items_user_office
    ON mx_system.nav_user_items(user_id, office_id);

COMMENT ON COLUMN mx_system.nav_user_items.office_id IS
    'Офіс, для якого діє цей дозвіл. Один пункт меню може бути активований для різних офісів незалежно.';

COMMENT ON COLUMN mx_system.nav_user_items.is_auto_assigned IS
    'Якщо true, меню було призначено автоматично (зарезервовано для майбутнього використання)';


-- =========================================================
-- VIEW ДЛЯ АДМІНІСТРАТОРА — 3D-матриця: user × office × item
-- Фільтрація за user_id та office_id відбувається у TypeScript-запиті
-- =========================================================
DROP VIEW IF EXISTS mx_system.nav_user_items_admin_view CASCADE;

CREATE VIEW mx_system.nav_user_items_admin_view AS
SELECT
    -- Користувач
    u.id                         AS user_id,
    u.name                       AS user_name,

    -- Офіс
    o.id                         AS office_id,
    o.title                      AS office_title,

    -- Меню
    m.id                         AS menu_id,
    m.title                      AS menu_title,
    m.sort_order                 AS menu_sort_order,

    -- Пункт меню
    i.id                         AS item_id,
    i.title                      AS item_title,
    i.icon                       AS item_icon,
    i.url                        AS item_url,
    i.sort_order                 AS item_sort_order,
    i.is_active                  AS item_is_active_global,

    -- Призначення (чи є запис для цієї комбінації user + office + menu_item)
    (nui.id IS NOT NULL)         AS item_is_assigned,
    (nui.id IS NOT NULL)
        AND i.is_active
        AND m.is_active          AS item_is_effective_active,

    -- Метадані
    nui.id                       AS nav_user_item_id,
    nui.created_at               AS created_at,
    nui.created_by               AS created_by
FROM
    public."user" u
    -- Всі офіси для кожного користувача
    CROSS JOIN mx_dic.offices o
    -- Всі меню
    CROSS JOIN mx_dic.menus m
    -- Всі пункти меню для кожного меню
    JOIN mx_dic.menu_user_items i
        ON i.menu_id = m.id
    -- Ліве приєднання дозволів (можуть бути або не бути)
    LEFT JOIN mx_system.nav_user_items nui
        ON nui.user_id = u.id
       AND nui.office_id = o.id
       AND nui.menu_id = i.id
ORDER BY
    u.name,
    o.sort_order,
    o.id,
    m.sort_order,
    m.id,
    i.sort_order,
    i.id;


-- =========================================================
-- VIEW ДЛЯ САЙДБАРУ — фільтр за офісом за замовчуванням
-- Показує пункти меню для поточного дефолтного офісу:
--   - явно призначені (nav_user_items) для цього офісу
--   - АБО is_default = true — для всіх офісів користувача
-- =========================================================
DROP VIEW IF EXISTS mx_system.nav_user_items_user_view CASCADE;

CREATE VIEW mx_system.nav_user_items_user_view AS
SELECT DISTINCT ON (u.id, i.id)
    -- Користувач
    u.id                         AS user_id,

    -- Офіс (поточний дефолтний офіс користувача)
    uo.office_id                 AS office_id,

    -- Меню
    m.id                         AS menu_id,
    m.title                      AS menu_title,
    m.sort_order                 AS menu_sort_order,

    -- Пункт меню
    i.id                         AS item_id,
    i.title                      AS item_title,
    i.icon                       AS item_icon,
    i.url                        AS item_url,
    i.sort_order                 AS item_sort_order,
    i.is_active                  AS item_is_active_global
FROM
    public."user" u
    -- Дефолтний офіс користувача
    JOIN mx_system.user_offices uo
        ON uo.user_id = u.id
       AND uo.is_default = TRUE
    -- Всі пункти меню
    CROSS JOIN mx_dic.menu_user_items i
    JOIN mx_dic.menus m
        ON m.id = i.menu_id
WHERE
    m.is_active = TRUE
    AND i.is_active = TRUE
    AND (
        -- Явно призначено для цього офісу
        EXISTS (
            SELECT 1 FROM mx_system.nav_user_items nui
            WHERE nui.user_id = u.id
              AND nui.menu_id = i.id
              AND nui.office_id = uo.office_id
        )
        OR
        -- Або позначено як загальнодоступне (для всіх офісів)
        i.is_default = TRUE
    )
ORDER BY
    u.id,
    i.id,
    m.sort_order,
    m.id,
    i.sort_order;
