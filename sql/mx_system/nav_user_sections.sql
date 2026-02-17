CREATE SCHEMA IF NOT EXISTS mx_system;

-- -------------------------------------------------
-- Права доступу користувачів до пунктів меню
-- -------------------------------------------------
DROP TABLE IF EXISTS mx_system.nav_user_sections CASCADE;

CREATE TABLE IF NOT EXISTS mx_system.nav_user_sections
(
    id         SERIAL      PRIMARY KEY,     -- технічний ідентифікатор запису
    user_id    text        NOT NULL,        -- ідентифікатор користувача (з Better Auth, тип text)
    menu_id    int         NOT NULL,        -- FK на пункт меню (mx_dic.menu_user_sections_items.id)
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, -- дата/час надання доступу
    created_by text        NOT NULL,        -- хто надав доступ (id користувача-адміністратора)
    is_auto_assigned boolean NOT NULL DEFAULT false, -- чи було призначено автоматично через тригер

    -- Зовнішні ключі на таблицю користувачів
    CONSTRAINT nav_user_sections_fk_user
        FOREIGN KEY (user_id)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    CONSTRAINT nav_user_sections_fk_created_by
        FOREIGN KEY (created_by)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    -- Зовнішній ключ на пункт меню
    CONSTRAINT nav_user_sections_fk_menu_item
        FOREIGN KEY (menu_id)
        REFERENCES mx_dic.menu_user_sections_items(id)
        ON DELETE CASCADE,

    -- Один і той самий пункт меню не можна призначити одному користувачу двічі
    CONSTRAINT nav_user_sections_user_menu_unique
        UNIQUE (user_id, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_nav_user_sections_is_auto_assigned
    ON mx_system.nav_user_sections(is_auto_assigned, menu_id)
    WHERE is_auto_assigned = true;

COMMENT ON COLUMN mx_system.nav_user_sections.is_auto_assigned IS
    'Якщо true, меню було призначено автоматично через тригер при встановленні is_default = true. Такі меню будуть автоматично видалені при знятті is_default = false';


-- =====================================================================
-- 2. VIEW ДЛЯ АДМІНІСТРАТОРА
--    Повна матриця: користувач × категорія × пункт меню
-- =====================================================================

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


-- =====================================================================
-- 3. VIEW ДЛЯ ВИВЕДЕННЯ МЕНЮ КОНКРЕТНОГО КОРИСТУВАЧА (САЙДБАР)
--    Показує тільки дозволені та глобально активні пункти
-- =====================================================================

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









