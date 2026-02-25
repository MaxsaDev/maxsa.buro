-- ======================================================
-- МІГРАЦІЯ 012: Виправлення assignee_data + таблиця зв'язку виконавець↔офіс
-- ======================================================
-- Проблема 1: mx_data.assignee_data мала FK на неіснуючу колонку updated_user_id.
-- Проблема 2: UNIQUE стояв на user_id замість user_data_id.
-- Проблема 3: не було FK user_data_id → mx_data.user_data.
--
-- Рішення:
-- 1. Додати колонку updated_by (uuid NULL FK → public."user")
-- 2. Перебудувати UNIQUE: прибрати UNIQUE(user_id), додати UNIQUE(user_data_id)
-- 3. Додати FK user_data_id → mx_data.user_data(id)
-- 4. Прибрати хибний FK на updated_user_id (якщо існує)
-- 5. Створити таблицю mx_data.assignee_offices (M:M виконавець↔офіс)
-- 6. Оновити VIEW mx_data.assignee_data_view
-- ======================================================
BEGIN;

-- ======================================================
-- 1. Додати колонку updated_by
-- ======================================================
ALTER TABLE mx_data.assignee_data
    ADD COLUMN IF NOT EXISTS updated_by text NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'assignee_data_fk_updated_by'
          AND conrelid = 'mx_data.assignee_data'::regclass
    ) THEN
        ALTER TABLE mx_data.assignee_data
            ADD CONSTRAINT assignee_data_fk_updated_by
                FOREIGN KEY (updated_by) REFERENCES public."user" (id) ON DELETE SET NULL;
    END IF;
END;
$$;

-- ======================================================
-- 2. Прибрати хибний FK на updated_user_id (якщо існує)
-- ======================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'assignee_data_fk_updated_user'
          AND conrelid = 'mx_data.assignee_data'::regclass
    ) THEN
        ALTER TABLE mx_data.assignee_data
            DROP CONSTRAINT assignee_data_fk_updated_user;
    END IF;
END;
$$;

-- ======================================================
-- 3. Додати FK user_data_id → mx_data.user_data(id)
-- ======================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'assignee_data_fk_user_data'
          AND conrelid = 'mx_data.assignee_data'::regclass
    ) THEN
        ALTER TABLE mx_data.assignee_data
            ADD CONSTRAINT assignee_data_fk_user_data
                FOREIGN KEY (user_data_id) REFERENCES mx_data.user_data (id) ON DELETE CASCADE;
    END IF;
END;
$$;

-- ======================================================
-- 4. Перебудувати UNIQUE: user_id → user_data_id
-- ======================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'assignee_data_unique_user_id'
          AND conrelid = 'mx_data.assignee_data'::regclass
    ) THEN
        ALTER TABLE mx_data.assignee_data
            DROP CONSTRAINT assignee_data_unique_user_id;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'assignee_data_unique_user_data_id'
          AND conrelid = 'mx_data.assignee_data'::regclass
    ) THEN
        ALTER TABLE mx_data.assignee_data
            ADD CONSTRAINT assignee_data_unique_user_data_id
                UNIQUE (user_data_id);
    END IF;
END;
$$;

-- Індекси для assignee_data
CREATE INDEX IF NOT EXISTS assignee_data_user_data_id_idx ON mx_data.assignee_data (user_data_id);
CREATE INDEX IF NOT EXISTS assignee_data_user_id_idx      ON mx_data.assignee_data (user_id);
CREATE INDEX IF NOT EXISTS assignee_data_post_idx         ON mx_data.assignee_data (post_assignee_id);

-- ======================================================
-- 5. Створити таблицю mx_data.assignee_offices (M:M)
-- ======================================================
CREATE TABLE IF NOT EXISTS mx_data.assignee_offices
(
    id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignee_data_id uuid        NOT NULL,
    office_id        int         NOT NULL,
    is_default       boolean     NOT NULL DEFAULT FALSE,
    created_at       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT assignee_offices_fk_assignee
        FOREIGN KEY (assignee_data_id) REFERENCES mx_data.assignee_data (id) ON DELETE CASCADE,
    CONSTRAINT assignee_offices_fk_office
        FOREIGN KEY (office_id) REFERENCES mx_dic.offices (id) ON DELETE CASCADE,
    CONSTRAINT assignee_offices_unique
        UNIQUE (assignee_data_id, office_id)
);

CREATE INDEX IF NOT EXISTS assignee_offices_assignee_idx ON mx_data.assignee_offices (assignee_data_id);
CREATE INDEX IF NOT EXISTS assignee_offices_office_idx   ON mx_data.assignee_offices (office_id);

COMMENT ON TABLE mx_data.assignee_offices IS
'Прив''язка виконавців до офісів. Відсутність записів = виконавець для всіх офісів. Наявність записів = лише для вказаних офісів. is_default = офіс за замовчуванням.';

-- ======================================================
-- 6. Оновити VIEW mx_data.assignee_data_view
-- ======================================================
DROP VIEW IF EXISTS mx_data.assignee_data_view CASCADE;

CREATE VIEW mx_data.assignee_data_view AS
SELECT
    ad.id                                                                   AS assignee_id,
    ad.user_data_id,
    ad.user_id,
    ud.full_name,
    ad.post_assignee_id,
    dp.title                                                                AS post_assignee_title,
    ad.description,
    ad.updated_by,
    ad.created_at,
    ad.updated_at,
    -- основний контакт (LATERAL)
    uc.contact_value,
    dct.code                                                                AS contact_type_code,
    uc.contact_type_id,
    mx_data.fn_contact_build_url(dct.code, uc.contact_value)               AS contact_url,
    -- дані акаунту (якщо є)
    u.name                                                                  AS user_name,
    u.image                                                                 AS user_image,
    u."isBanned"                                                            AS is_banned
FROM mx_data.assignee_data ad
    JOIN mx_data.user_data ud
        ON ud.id = ad.user_data_id
    JOIN mx_dic.dic_posts_assignee dp
        ON dp.id = ad.post_assignee_id
    LEFT JOIN LATERAL (
        SELECT c.contact_value, c.contact_type_id
        FROM mx_data.user_contact c
        WHERE (ad.user_id IS NOT NULL AND c.user_id = ad.user_id)
           OR (ad.user_id IS NULL AND c.user_data_id = ad.user_data_id)
        ORDER BY c.is_default DESC, c.updated_at DESC
        LIMIT 1
    ) uc ON TRUE
    LEFT JOIN mx_dic.dic_contact_type dct
        ON dct.id = uc.contact_type_id
    LEFT JOIN public."user" u
        ON u.id = ad.user_id
;

COMMIT;
