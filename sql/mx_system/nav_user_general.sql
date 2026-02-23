CREATE SCHEMA IF NOT EXISTS mx_system;

-- =========================================================
-- ПРИЗНАЧЕННЯ ПУНКТІВ ЗАГАЛЬНОГО МЕНЮ КОРИСТУВАЧАМ
-- БЕЗ ПРИВ'ЯЗКИ ДО ОФІСУ — пункти видно завжди
-- =========================================================
DROP TABLE IF EXISTS mx_system.nav_user_general CASCADE;

CREATE TABLE IF NOT EXISTS mx_system.nav_user_general
(
    id               SERIAL      PRIMARY KEY,
    user_id          text        NOT NULL,        -- ідентифікатор користувача (Better Auth, тип text)
    menu_id          int         NOT NULL,        -- FK на пункт меню (mx_dic.menu_general_items.id)
    created_at       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       text        NOT NULL,        -- хто надав доступ (id адміністратора)
    is_auto_assigned boolean     NOT NULL DEFAULT false,

    CONSTRAINT nav_user_general_fk_user
        FOREIGN KEY (user_id)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    CONSTRAINT nav_user_general_fk_created_by
        FOREIGN KEY (created_by)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    CONSTRAINT nav_user_general_fk_menu_item
        FOREIGN KEY (menu_id)
        REFERENCES mx_dic.menu_general_items(id)
        ON DELETE CASCADE,

    -- Один пункт загального меню не може бути призначений одному користувачу двічі
    CONSTRAINT nav_user_general_user_menu_unique
        UNIQUE (user_id, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_nav_user_general_user_id
    ON mx_system.nav_user_general(user_id);

CREATE INDEX IF NOT EXISTS idx_nav_user_general_is_auto_assigned
    ON mx_system.nav_user_general(is_auto_assigned, menu_id)
    WHERE is_auto_assigned = true;

COMMENT ON TABLE mx_system.nav_user_general IS
'Призначення пунктів загального меню конкретним користувачам. Без прив''язки до офісу — пункти видно завжди в сайдбарі.';

COMMENT ON COLUMN mx_system.nav_user_general.is_auto_assigned IS
    'Якщо true, пункт меню було призначено автоматично (зарезервовано для майбутнього використання)';


-- =====================================================================
-- 2. VIEW ДЛЯ АДМІНІСТРАТОРА
--    2D-матриця: користувач × пункт загального меню
--    Фільтрація за user_id відбувається у TypeScript-запиті
-- =====================================================================

DROP VIEW IF EXISTS mx_system.nav_user_general_admin_view CASCADE;

CREATE VIEW mx_system.nav_user_general_admin_view AS
SELECT
    -- Користувач
    u.id                                    AS user_id,
    u.name                                  AS user_name,

    -- Меню
    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    -- Пункт меню
    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global,

    -- Призначення пункту меню користувачу
    (nug.id IS NOT NULL)                    AS item_is_assigned,
    (nug.id IS NOT NULL)
        AND i.is_active
        AND m.is_active                     AS item_is_effective_active,

    -- Метадані призначення
    nug.id                                  AS nav_user_general_id,
    nug.created_at                          AS created_at,
    nug.created_by                          AS created_by
FROM
    public."user" u
    -- Всі меню типу 'general'
    CROSS JOIN mx_dic.menus m
    -- Всі пункти загального меню
    JOIN mx_dic.menu_general_items i
        ON i.menu_id = m.id
    -- Ліве приєднання прав доступу (може не існувати)
    LEFT JOIN mx_system.nav_user_general nug
        ON nug.user_id = u.id
       AND nug.menu_id = i.id
ORDER BY
    u.name,
    m.sort_order,
    m.id,
    i.sort_order,
    i.id;


-- =====================================================================
-- 3. VIEW ДЛЯ ВИВЕДЕННЯ ЗАГАЛЬНОГО МЕНЮ КОНКРЕТНОГО КОРИСТУВАЧА (САЙДБАР)
--    Показує:
--      - пункти, явно призначені користувачу (nav_user_general)
--      - пункти з is_default = true — видно всім активним користувачам
--    БЕЗ ФІЛЬТРАЦІЇ ЗА ОФІСОМ — відображається завжди
-- =====================================================================

DROP VIEW IF EXISTS mx_system.nav_user_general_user_view CASCADE;

CREATE VIEW mx_system.nav_user_general_user_view AS
SELECT DISTINCT ON (u.id, i.id)
    -- Користувач
    u.id                                    AS user_id,

    -- Меню
    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    -- Пункт меню
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
