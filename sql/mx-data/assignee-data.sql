CREATE SCHEMA IF NOT EXISTS mx_data;

-- -------------------------------------------------
-- Таблиця виконавців
-- Кожен запис = одна особа (user_data) як виконавець
-- user_data_id → mx_data.user_data.id (унікальний: 1 особа = 1 виконавець)
-- user_id → public."user".id (NULL для виконавців без акаунту в системі)
-- -------------------------------------------------
DROP VIEW IF EXISTS mx_data.assignee_data_view CASCADE;
DROP TABLE IF EXISTS mx_data.assignee_data CASCADE;

CREATE TABLE mx_data.assignee_data
(
    id               uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_data_id     uuid         NOT NULL,
    user_id          text         NULL,
    post_assignee_id INTEGER      NOT NULL,
    description      TEXT         NULL,
    updated_by       text         NULL,

    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT assignee_data_fk_user_data
        FOREIGN KEY (user_data_id) REFERENCES mx_data.user_data (id) ON DELETE CASCADE,
    CONSTRAINT assignee_data_fk_user
        FOREIGN KEY (user_id) REFERENCES public."user" (id) ON DELETE SET NULL,
    CONSTRAINT assignee_data_fk_updated_by
        FOREIGN KEY (updated_by) REFERENCES public."user" (id) ON DELETE SET NULL,
    CONSTRAINT assignee_data_fk_post_assignee
        FOREIGN KEY (post_assignee_id) REFERENCES mx_dic.dic_posts_assignee (id) ON DELETE RESTRICT,
    CONSTRAINT assignee_data_unique_user_data_id
        UNIQUE (user_data_id)
);

CREATE INDEX IF NOT EXISTS assignee_data_user_data_id_idx ON mx_data.assignee_data (user_data_id);
CREATE INDEX IF NOT EXISTS assignee_data_user_id_idx      ON mx_data.assignee_data (user_id);
CREATE INDEX IF NOT EXISTS assignee_data_post_idx         ON mx_data.assignee_data (post_assignee_id);

COMMENT ON TABLE mx_data.assignee_data IS
'Виконавці послуг. Кожен запис відповідає одній особі (user_data). Зв''язок з офісами — через mx_data.assignee_offices.';

-- -------------------------------------------------
-- Таблиця зв'язку виконавець ↔ офіс (M:M)
-- Якщо записів немає — виконавець доступний для всіх офісів
-- Якщо є записи — лише для вказаних офісів
-- -------------------------------------------------
DROP TABLE IF EXISTS mx_data.assignee_offices CASCADE;

CREATE TABLE mx_data.assignee_offices
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

-- -------------------------------------------------
-- VIEW: повний перегляд виконавця (з контактом)
-- -------------------------------------------------
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
