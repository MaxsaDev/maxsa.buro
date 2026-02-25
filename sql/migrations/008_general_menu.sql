-- ============================================================
-- МІГРАЦІЯ 008: Загальне меню (без прив'язки до офісу)
-- Додає таблиці та view для меню, яке відображається
-- завжди, незалежно від вибраного офісу користувача.
-- ============================================================

BEGIN;

-- 1. Новий тип меню 'general'
INSERT INTO mx_dic.menu_types (code, title, sort_order)
VALUES ('general', 'Загальне меню (без офісу)', 30)
ON CONFLICT (code) DO NOTHING;

-- 1a. Базовий запис меню типу 'general' (якщо ще немає)
INSERT INTO mx_dic.menus (title, menu_type_id, sort_order, is_active)
SELECT 'Загальне меню', mt.id, 50, TRUE
FROM mx_dic.menu_types mt
WHERE mt.code = 'general'
  AND NOT EXISTS (
    SELECT 1 FROM mx_dic.menus m WHERE m.menu_type_id = mt.id
  );

-- 2. Таблиця пунктів загального меню
CREATE TABLE IF NOT EXISTS mx_dic.menu_general_items
(
    id          SERIAL      PRIMARY KEY,
    menu_id     int         NOT NULL,
    title       text        NOT NULL,
    icon        text        NOT NULL,
    url         text        NOT NULL,
    sort_order  int         NOT NULL DEFAULT 100,
    is_active   boolean     NOT NULL DEFAULT TRUE,
    is_default  boolean     NOT NULL DEFAULT FALSE,

    CONSTRAINT menu_general_items_fk_menu
        FOREIGN KEY (menu_id)
        REFERENCES mx_dic.menus(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_general_items_menu_id
    ON mx_dic.menu_general_items(menu_id);

COMMENT ON TABLE mx_dic.menu_general_items IS
'Пункти загального меню. Відображаються в сайдбарі завжди, незалежно від вибраного офісу.';

-- 3. Таблиця призначення пунктів загального меню користувачам
CREATE TABLE IF NOT EXISTS mx_system.nav_user_general
(
    id               SERIAL      PRIMARY KEY,
    user_id          text        NOT NULL,
    menu_id          int         NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       text        NOT NULL,
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

    CONSTRAINT nav_user_general_user_menu_unique
        UNIQUE (user_id, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_nav_user_general_user_id
    ON mx_system.nav_user_general(user_id);

-- 4. VIEW для адміністратора — 2D-матриця: user × menu_general_items
DROP VIEW IF EXISTS mx_system.nav_user_general_admin_view CASCADE;

CREATE VIEW mx_system.nav_user_general_admin_view AS
SELECT
    u.id                                    AS user_id,
    u.name                                  AS user_name,

    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global,

    (nug.id IS NOT NULL)                    AS item_is_assigned,
    (nug.id IS NOT NULL)
        AND i.is_active
        AND m.is_active                     AS item_is_effective_active,

    nug.id                                  AS nav_user_general_id,
    nug.created_at                          AS created_at,
    nug.created_by                          AS created_by
FROM
    public."user" u
    CROSS JOIN mx_dic.menus m
    JOIN mx_dic.menu_general_items i
        ON i.menu_id = m.id
    LEFT JOIN mx_system.nav_user_general nug
        ON nug.user_id = u.id
       AND nug.menu_id = i.id
ORDER BY
    u.name,
    m.sort_order,
    m.id,
    i.sort_order,
    i.id;

-- 5. VIEW для сайдбару:
--    - пункти явно призначені користувачу (nav_user_general)
--    - АБО is_default = true — видно всім активним користувачам
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
        EXISTS (
            SELECT 1 FROM mx_system.nav_user_general nug
            WHERE nug.user_id = u.id AND nug.menu_id = i.id
        )
        OR i.is_default = TRUE
    )
ORDER BY
    u.id,
    i.id,
    m.sort_order,
    m.id,
    i.sort_order;

COMMIT;
