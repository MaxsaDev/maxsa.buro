CREATE SCHEMA IF NOT EXISTS mx_system;

-- -------------------------------------------------
-- Права доступу користувачів до повноважень
-- -------------------------------------------------
DROP TABLE IF EXISTS mx_system.nav_user_permissions CASCADE;

CREATE TABLE IF NOT EXISTS mx_system.nav_user_permissions
(
    id         SERIAL      PRIMARY KEY,     -- технічний ідентифікатор запису
    user_id    text        NOT NULL,        -- ідентифікатор користувача (з Better Auth, тип text)
    permission_id int      NOT NULL,        -- FK на пункт повноваження (mx_dic.user_permissions_items.id)
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, -- дата/час надання доступу
    created_by text        NOT NULL,        -- хто надав доступ (id користувача-адміністратора)

    -- Зовнішні ключі на таблицю користувачів
    CONSTRAINT nav_user_permissions_fk_user
        FOREIGN KEY (user_id)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    CONSTRAINT nav_user_permissions_fk_created_by
        FOREIGN KEY (created_by)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    -- Зовнішній ключ на пункт повноваження
    CONSTRAINT nav_user_permissions_fk_permission_item
        FOREIGN KEY (permission_id)
        REFERENCES mx_dic.user_permissions_items(id)
        ON DELETE CASCADE,

    -- Один і той самий пункт повноваження не можна призначити одному користувачу двічі
    CONSTRAINT nav_user_permissions_user_permission_unique
        UNIQUE (user_id, permission_id)
);


-- =====================================================================
-- VIEW ДЛЯ АДМІНІСТРАТОРА
--    Повна матриця: користувач × категорія × пункт повноваження
-- =====================================================================

DROP VIEW IF EXISTS mx_system.nav_user_permissions_admin_view CASCADE;

CREATE VIEW mx_system.nav_user_permissions_admin_view AS
SELECT
    -- Користувач
    u.id                                    AS user_id,               -- ідентифікатор користувача
    u.name                                  AS user_name,             -- ім'я користувача (для відображення в адмінці)

    -- Категорія повноважень
    c.id                                    AS category_id,           -- ідентифікатор категорії
    c.title                                 AS category_title,        -- назва категорії
    c.description                           AS category_description,  -- опис категорії
    c.icon                                  AS category_icon,         -- іконка категорії
    c.is_active                             AS category_is_active,    -- глобальна активність категорії

    -- Пункт повноваження
    p.id                                    AS permission_id,         -- ідентифікатор пункту повноваження
    p.title                                 AS permission_title,      -- назва пункту повноваження
    p.description                           AS permission_description, -- опис пункту повноваження
    p.sort_order                            AS permission_sort_order, -- порядок сортування
    p.is_active                             AS permission_is_active_global, -- глобальна активність пункту повноваження

    -- Призначення пункту повноваження користувачу
    (nup.id IS NOT NULL)                    AS permission_is_assigned, -- чи є запис у nav_user_permissions
    (nup.id IS NOT NULL)
        AND p.is_active
        AND c.is_active                     AS permission_is_effective_active, -- фактична активність з урахуванням глобальних прапорів

    -- Метадані призначення
    nup.id                                  AS nav_user_permission_id, -- id запису про доступ
    nup.created_at                          AS created_at,            -- коли виданий доступ
    nup.created_by                          AS created_by             -- ким виданий доступ
FROM
    public."user" u
    -- Всі категорії для кожного користувача
    CROSS JOIN mx_dic.user_permissions_category c
    -- Всі пункти повноважень для кожної категорії
    JOIN mx_dic.user_permissions_items p
        ON p.category_id = c.id
    -- Ліве приєднання прав доступу (може не існувати)
    LEFT JOIN mx_system.nav_user_permissions nup
        ON nup.user_id = u.id
       AND nup.permission_id = p.id
ORDER BY
    u.name,
    c.id,
    p.sort_order,
    p.id;


-- =====================================================================
-- VIEW ДЛЯ ВИВЕДЕННЯ ПОВНОВАЖЕНЬ КОНКРЕТНОГО КОРИСТУВАЧА
--    Показує тільки дозволені та глобально активні повноваження
-- =====================================================================

DROP VIEW IF EXISTS mx_system.nav_user_permissions_user_view CASCADE;

CREATE VIEW mx_system.nav_user_permissions_user_view AS
SELECT
    -- Користувач
    u.id                                    AS user_id,               -- ідентифікатор користувача

    -- Категорія
    c.id                                    AS category_id,           -- ідентифікатор категорії
    c.title                                 AS category_title,        -- назва категорії
    c.description                           AS category_description,  -- опис категорії
    c.icon                                  AS category_icon,         -- іконка категорії
    c.is_active                             AS category_is_active,    -- глобальна активність категорії

    -- Пункт повноваження
    p.id                                    AS permission_id,         -- ідентифікатор пункту повноваження
    p.title                                 AS permission_title,      -- назва пункту повноваження
    p.description                           AS permission_description, -- опис пункту повноваження
    p.sort_order                            AS permission_sort_order,  -- порядок сортування в межах категорії
    p.is_active                             AS permission_is_active_global -- глобальна активність пункту повноваження
FROM
    mx_system.nav_user_permissions nup
    JOIN public."user" u
        ON u.id = nup.user_id
    JOIN mx_dic.user_permissions_items p
        ON p.id = nup.permission_id
    JOIN mx_dic.user_permissions_category c
        ON c.id = p.category_id
WHERE
    -- категорія має бути активною
    c.is_active = TRUE
    -- пункт повноваження має бути глобально активним
    AND p.is_active = TRUE
ORDER BY
    u.id,
    c.id,
    p.sort_order,
    p.id;
