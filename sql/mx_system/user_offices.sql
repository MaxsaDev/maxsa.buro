CREATE SCHEMA IF NOT EXISTS mx_system;

-- -------------------------------------------------
-- Призначення офісів (філій) користувачам
-- -------------------------------------------------
DROP TABLE IF EXISTS mx_system.user_offices CASCADE;

CREATE TABLE IF NOT EXISTS mx_system.user_offices
(
    id         SERIAL      PRIMARY KEY,     -- технічний ідентифікатор запису
    user_id    text        NOT NULL,        -- ідентифікатор користувача (з Better Auth, тип text)
    office_id  int         NOT NULL,        -- FK на офіс (mx_dic.offices.id)
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, -- дата/час призначення
    created_by text        NOT NULL,        -- хто призначив (id користувача-адміністратора)

    -- Зовнішні ключі на таблицю користувачів
    CONSTRAINT user_offices_fk_user
        FOREIGN KEY (user_id)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    CONSTRAINT user_offices_fk_created_by
        FOREIGN KEY (created_by)
        REFERENCES public."user"(id)
        ON DELETE CASCADE,

    -- Зовнішній ключ на офіс
    CONSTRAINT user_offices_fk_office
        FOREIGN KEY (office_id)
        REFERENCES mx_dic.offices(id)
        ON DELETE CASCADE,

    -- Один і той самий офіс не можна призначити одному користувачу двічі
    CONSTRAINT user_offices_user_office_unique
        UNIQUE (user_id, office_id)
);


-- =====================================================================
-- VIEW ДЛЯ АДМІНІСТРАТОРА
--    Повна матриця: користувач × офіс
-- =====================================================================

DROP VIEW IF EXISTS mx_system.user_offices_admin_view CASCADE;

CREATE VIEW mx_system.user_offices_admin_view AS
SELECT
    -- Користувач
    u.id                                    AS user_id,               -- ідентифікатор користувача
    u.name                                  AS user_name,             -- ім'я користувача (для відображення в адмінці)

    -- Офіс
    o.id                                    AS office_id,             -- ідентифікатор офісу
    o.title                                 AS office_title,          -- назва офісу
    o.city                                  AS office_city,           -- місто офісу
    o.is_active                             AS office_is_active,      -- глобальна активність офісу
    o.sort_order                            AS office_sort_order,     -- порядок сортування

    -- Призначення офісу користувачу
    (uo.id IS NOT NULL)                     AS office_is_assigned,    -- чи є запис у user_offices
    (uo.id IS NOT NULL)
        AND o.is_active                     AS office_is_effective_active, -- фактична активність з урахуванням глобального прапора

    -- Метадані призначення
    uo.id                                   AS user_office_id,        -- id запису про призначення
    uo.created_at                           AS created_at,            -- коли призначено
    uo.created_by                           AS created_by             -- ким призначено
FROM
    public."user" u
    -- Всі офіси для кожного користувача
    CROSS JOIN mx_dic.offices o
    -- Ліве приєднання призначень (може не існувати)
    LEFT JOIN mx_system.user_offices uo
        ON uo.user_id = u.id
       AND uo.office_id = o.id
ORDER BY
    u.name,
    o.sort_order,
    o.id;


-- =====================================================================
-- VIEW ДЛЯ ВИВЕДЕННЯ ОФІСІВ КОНКРЕТНОГО КОРИСТУВАЧА
--    Показує тільки призначені та глобально активні офіси
-- =====================================================================

DROP VIEW IF EXISTS mx_system.user_offices_user_view CASCADE;

CREATE VIEW mx_system.user_offices_user_view AS
SELECT
    -- Користувач
    u.id                                    AS user_id,               -- ідентифікатор користувача

    -- Офіс
    o.id                                    AS office_id,             -- ідентифікатор офісу
    o.title                                 AS office_title,          -- назва офісу
    o.city                                  AS office_city,           -- місто офісу
    o.address                               AS office_address,        -- адреса офісу
    o.phone                                 AS office_phone,          -- телефон офісу
    o.email                                 AS office_email           -- електронна пошта офісу
FROM
    mx_system.user_offices uo
    JOIN public."user" u
        ON u.id = uo.user_id
    JOIN mx_dic.offices o
        ON o.id = uo.office_id
WHERE
    -- офіс має бути активним
    o.is_active = TRUE
ORDER BY
    u.id,
    o.sort_order,
    o.id;
