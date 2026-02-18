CREATE SCHEMA IF NOT EXISTS mx_system;

-- -------------------------------------------------
-- Права доступу користувачів до пунктів меню з прив'язкою до офісу
-- -------------------------------------------------
DROP TABLE IF EXISTS mx_system.nav_user_sections CASCADE;

CREATE TABLE IF NOT EXISTS mx_system.nav_user_sections
(
    id               SERIAL      PRIMARY KEY,
    user_id          text        NOT NULL,        -- ідентифікатор користувача (з Better Auth, тип text)
    menu_id          int         NOT NULL,        -- FK на пункт меню (mx_dic.menu_user_sections_items.id)
    office_id        int         NOT NULL,        -- FK на офіс (mx_dic.offices.id)
    created_at       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       text        NOT NULL,        -- хто надав доступ (id користувача-адміністратора)
    is_auto_assigned boolean     NOT NULL DEFAULT false,

    CONSTRAINT nav_user_sections_fk_user
        FOREIGN KEY (user_id)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    CONSTRAINT nav_user_sections_fk_created_by
        FOREIGN KEY (created_by)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    CONSTRAINT nav_user_sections_fk_menu_item
        FOREIGN KEY (menu_id)
        REFERENCES mx_dic.menu_user_sections_items(id)
        ON DELETE CASCADE,

    CONSTRAINT nav_user_sections_fk_office
        FOREIGN KEY (office_id)
        REFERENCES mx_dic.offices(id)
        ON DELETE CASCADE,

    -- Один пункт меню не може бути призначений одному користувачу в одному офісі двічі
    CONSTRAINT nav_user_sections_user_menu_office_unique
        UNIQUE (user_id, menu_id, office_id)
);

CREATE INDEX IF NOT EXISTS idx_nav_user_sections_is_auto_assigned
    ON mx_system.nav_user_sections(is_auto_assigned, menu_id)
    WHERE is_auto_assigned = true;

CREATE INDEX IF NOT EXISTS idx_nav_user_sections_user_office
    ON mx_system.nav_user_sections(user_id, office_id);

COMMENT ON COLUMN mx_system.nav_user_sections.office_id IS
    'Офіс, для якого діє цей дозвіл. Один пункт меню може бути активований для різних офісів незалежно.';

COMMENT ON COLUMN mx_system.nav_user_sections.is_auto_assigned IS
    'Якщо true, меню було призначено автоматично (зарезервовано для майбутнього використання)';


-- =====================================================================
-- 2. VIEW ДЛЯ АДМІНІСТРАТОРА
--    3D-матриця: користувач × офіс × категорія × пункт меню
--    Фільтрація за user_id та office_id відбувається у TypeScript-запиті
-- =====================================================================

DROP VIEW IF EXISTS mx_system.nav_user_sections_admin_view CASCADE;

CREATE VIEW mx_system.nav_user_sections_admin_view AS
SELECT
    -- Користувач
    u.id                                    AS user_id,
    u.name                                  AS user_name,

    -- Офіс
    o.id                                    AS office_id,
    o.title                                 AS office_title,

    -- Меню
    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    -- Категорія меню
    c.id                                    AS category_id,
    c.title                                 AS category_title,
    c.url                                   AS category_url,
    c.icon                                  AS category_icon,
    c.is_active                             AS category_is_active,

    -- Пункт меню
    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global,

    -- Призначення пункту меню користувачу в конкретному офісі
    (nus.id IS NOT NULL)                    AS item_is_assigned,
    (nus.id IS NOT NULL)
        AND i.is_active
        AND c.is_active
        AND m.is_active                     AS item_is_effective_active,

    -- Метадані призначення
    nus.id                                  AS nav_user_section_id,
    nus.created_at                          AS created_at,
    nus.created_by                          AS created_by
FROM
    public."user" u
    -- Всі офіси для кожного користувача
    CROSS JOIN mx_dic.offices o
    -- Всі меню для кожного офісу
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
       AND nus.office_id = o.id
       AND nus.menu_id = i.id
ORDER BY
    u.name,
    o.sort_order,
    o.id,
    m.sort_order,
    m.id,
    c.id,
    i.sort_order,
    i.id;


-- =====================================================================
-- 3. VIEW ДЛЯ ВИВЕДЕННЯ МЕНЮ КОНКРЕТНОГО КОРИСТУВАЧА (САЙДБАР)
--    Показує тільки дозволені та глобально активні пункти
--    для офісу, який є is_default у користувача
-- =====================================================================

DROP VIEW IF EXISTS mx_system.nav_user_sections_user_view CASCADE;

CREATE VIEW mx_system.nav_user_sections_user_view AS
SELECT
    -- Користувач
    u.id                                    AS user_id,

    -- Офіс (поточний дефолтний офіс користувача)
    uo.office_id                            AS office_id,

    -- Меню
    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    -- Категорія
    c.id                                    AS category_id,
    c.title                                 AS category_title,
    c.url                                   AS category_url,
    c.icon                                  AS category_icon,
    c.is_active                             AS category_is_active,

    -- Пункт меню
    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global
FROM
    mx_system.nav_user_sections nus
    JOIN public."user" u
        ON u.id = nus.user_id
    -- Фільтруємо тільки за дефолтним офісом користувача
    JOIN mx_system.user_offices uo
        ON uo.user_id = nus.user_id
       AND uo.office_id = nus.office_id
       AND uo.is_default = TRUE
    JOIN mx_dic.menu_user_sections_items i
        ON i.id = nus.menu_id
    JOIN mx_dic.menu_user_sections_category c
        ON c.id = i.category_id
    JOIN mx_dic.menus m
        ON m.id = c.menu_id
WHERE
    m.is_active = TRUE
    AND c.is_active = TRUE
    AND i.is_active = TRUE
ORDER BY
    u.id,
    m.sort_order,
    m.id,
    c.id,
    i.sort_order,
    i.id;
