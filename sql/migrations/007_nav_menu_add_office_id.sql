-- ============================================================
-- МІГРАЦІЯ 007: Додавання office_id до таблиць призначення меню
-- ============================================================
-- Мета: Прив'язати права доступу до меню до конкретного офісу.
--       Один і той самий пункт меню може бути активований або
--       деактивований для різних офісів незалежно.
--
-- Зміни:
--   1. Вимкнути тригери автопризначення меню (вставляють без office_id)
--   2. Очистити таблиці nav_user_sections та nav_user_items
--      (даних ще немає — проект у розробці)
--   3. Додати колонку office_id до обох таблиць
--   4. Замінити UNIQUE-обмеження (user_id, menu_id) → (user_id, menu_id, office_id)
--   5. Додати FK на mx_dic.offices
--   6. Додати індекс (user_id, office_id)
--   7. Оновити VIEW для адмін-панелі (3D-матриця: user × office × item)
--   8. Оновити VIEW для сайдбару (фільтр за офісом is_default)
--   9. Видалити функції та тригери автопризначення (архітектурне рішення:
--      призначення меню відбувається вручну в контексті офісу)
-- ============================================================

BEGIN;

-- ============================================================
-- КРОК 1: Вимкнути тригери автопризначення (перед змінами схеми)
-- ============================================================

DROP TRIGGER IF EXISTS trg_menu_user_sections_items_au_assign_default
  ON mx_dic.menu_user_sections_items;

DROP TRIGGER IF EXISTS trg_menu_user_items_au_assign_default
  ON mx_dic.menu_user_items;

DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_sections_items_au_assign_default();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_items_au_assign_default();

-- ============================================================
-- КРОК 1б: Видалити всі VIEW що залежать від таблиць
--           (перед ALTER TABLE — інакше PostgreSQL блокує зміну схеми)
-- ============================================================

DROP VIEW IF EXISTS mx_system.nav_user_sections_admin_view;
DROP VIEW IF EXISTS mx_system.nav_user_sections_user_view;
DROP VIEW IF EXISTS mx_system.nav_user_items_admin_view;
DROP VIEW IF EXISTS mx_system.nav_user_items_user_view;

-- ============================================================
-- КРОК 2: nav_user_sections — додати office_id
-- ============================================================

-- Видаляємо старе UNIQUE-обмеження
ALTER TABLE mx_system.nav_user_sections
  DROP CONSTRAINT IF EXISTS nav_user_sections_user_menu_unique;

-- Додаємо колонку office_id (тимчасово nullable для сумісності з існуючими даними)
ALTER TABLE mx_system.nav_user_sections
  ADD COLUMN IF NOT EXISTS office_id int;

-- Якщо є існуючі рядки без office_id — видаляємо їх
-- (таблиця порожня на цьому етапі розробки, але для безпеки)
DELETE FROM mx_system.nav_user_sections WHERE office_id IS NULL;

-- Встановлюємо NOT NULL
ALTER TABLE mx_system.nav_user_sections
  ALTER COLUMN office_id SET NOT NULL;

-- Додаємо FK на offices
ALTER TABLE mx_system.nav_user_sections
  ADD CONSTRAINT nav_user_sections_fk_office
    FOREIGN KEY (office_id)
    REFERENCES mx_dic.offices(id)
    ON DELETE CASCADE;

-- Додаємо нове UNIQUE-обмеження з office_id
ALTER TABLE mx_system.nav_user_sections
  ADD CONSTRAINT nav_user_sections_user_menu_office_unique
    UNIQUE (user_id, menu_id, office_id);

-- Додаємо індекс для запитів по user + office
CREATE INDEX IF NOT EXISTS idx_nav_user_sections_user_office
  ON mx_system.nav_user_sections(user_id, office_id);

COMMENT ON COLUMN mx_system.nav_user_sections.office_id IS
  'Офіс, для якого діє цей дозвіл. Один пункт меню може бути активований для різних офісів незалежно.';

-- ============================================================
-- КРОК 3: nav_user_items — додати office_id
-- ============================================================

ALTER TABLE mx_system.nav_user_items
  DROP CONSTRAINT IF EXISTS nav_user_items_user_menu_unique;

ALTER TABLE mx_system.nav_user_items
  ADD COLUMN IF NOT EXISTS office_id int;

DELETE FROM mx_system.nav_user_items WHERE office_id IS NULL;

ALTER TABLE mx_system.nav_user_items
  ALTER COLUMN office_id SET NOT NULL;

ALTER TABLE mx_system.nav_user_items
  ADD CONSTRAINT nav_user_items_fk_office
    FOREIGN KEY (office_id)
    REFERENCES mx_dic.offices(id)
    ON DELETE CASCADE;

ALTER TABLE mx_system.nav_user_items
  ADD CONSTRAINT nav_user_items_user_menu_office_unique
    UNIQUE (user_id, menu_id, office_id);

CREATE INDEX IF NOT EXISTS idx_nav_user_items_user_office
  ON mx_system.nav_user_items(user_id, office_id);

COMMENT ON COLUMN mx_system.nav_user_items.office_id IS
  'Офіс, для якого діє цей дозвіл. Один пункт меню може бути активований для різних офісів незалежно.';

-- ============================================================
-- КРОК 4: Оновити VIEW для адміністратора — nav_user_sections
--          3D-матриця: user × office × menu_item
-- ============================================================

DROP VIEW IF EXISTS mx_system.nav_user_sections_admin_view;
CREATE VIEW mx_system.nav_user_sections_admin_view AS
SELECT
    u.id                                    AS user_id,
    u.name                                  AS user_name,

    o.id                                    AS office_id,
    o.title                                 AS office_title,

    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    c.id                                    AS category_id,
    c.title                                 AS category_title,
    c.url                                   AS category_url,
    c.icon                                  AS category_icon,
    c.is_active                             AS category_is_active,

    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global,

    (nus.id IS NOT NULL)                    AS item_is_assigned,
    (nus.id IS NOT NULL)
        AND i.is_active
        AND c.is_active
        AND m.is_active                     AS item_is_effective_active,

    nus.id                                  AS nav_user_section_id,
    nus.created_at                          AS created_at,
    nus.created_by                          AS created_by
FROM
    public."user" u
    CROSS JOIN mx_dic.offices o
    CROSS JOIN mx_dic.menus m
    JOIN mx_dic.menu_user_sections_category c
        ON c.menu_id = m.id
    JOIN mx_dic.menu_user_sections_items i
        ON i.category_id = c.id
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

-- ============================================================
-- КРОК 5: Оновити VIEW для сайдбару — nav_user_sections
--          Фільтр за офісом is_default
-- ============================================================

DROP VIEW IF EXISTS mx_system.nav_user_sections_user_view;
CREATE VIEW mx_system.nav_user_sections_user_view AS
SELECT
    u.id                                    AS user_id,
    uo.office_id                            AS office_id,

    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    c.id                                    AS category_id,
    c.title                                 AS category_title,
    c.url                                   AS category_url,
    c.icon                                  AS category_icon,
    c.is_active                             AS category_is_active,

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

-- ============================================================
-- КРОК 6: Оновити VIEW для адміністратора — nav_user_items
--          3D-матриця: user × office × menu_item
-- ============================================================

DROP VIEW IF EXISTS mx_system.nav_user_items_admin_view;
CREATE VIEW mx_system.nav_user_items_admin_view AS
SELECT
    u.id                         AS user_id,
    u.name                       AS user_name,

    o.id                         AS office_id,
    o.title                      AS office_title,

    m.id                         AS menu_id,
    m.title                      AS menu_title,
    m.sort_order                 AS menu_sort_order,

    i.id                         AS item_id,
    i.title                      AS item_title,
    i.icon                       AS item_icon,
    i.url                        AS item_url,
    i.sort_order                 AS item_sort_order,
    i.is_active                  AS item_is_active_global,

    (nui.id IS NOT NULL)         AS item_is_assigned,
    (nui.id IS NOT NULL)
        AND i.is_active
        AND m.is_active          AS item_is_effective_active,

    nui.id                       AS nav_user_item_id,
    nui.created_at               AS created_at,
    nui.created_by               AS created_by
FROM
    public."user" u
    CROSS JOIN mx_dic.offices o
    CROSS JOIN mx_dic.menus m
    JOIN mx_dic.menu_user_items i
        ON i.menu_id = m.id
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

-- ============================================================
-- КРОК 7: Оновити VIEW для сайдбару — nav_user_items
--          Фільтр за офісом is_default
-- ============================================================

DROP VIEW IF EXISTS mx_system.nav_user_items_user_view;
CREATE VIEW mx_system.nav_user_items_user_view AS
SELECT
    u.id                         AS user_id,
    uo.office_id                 AS office_id,

    m.id                         AS menu_id,
    m.title                      AS menu_title,
    m.sort_order                 AS menu_sort_order,

    i.id                         AS item_id,
    i.title                      AS item_title,
    i.icon                       AS item_icon,
    i.url                        AS item_url,
    i.sort_order                 AS item_sort_order,
    i.is_active                  AS item_is_active_global
FROM
    mx_system.nav_user_items nui
    JOIN public."user" u
        ON u.id = nui.user_id
    JOIN mx_system.user_offices uo
        ON uo.user_id = nui.user_id
       AND uo.office_id = nui.office_id
       AND uo.is_default = TRUE
    JOIN mx_dic.menu_user_items i
        ON i.id = nui.menu_id
    JOIN mx_dic.menus m
        ON m.id = i.menu_id
WHERE
    m.is_active = TRUE
    AND i.is_active = TRUE
ORDER BY
    u.id,
    m.sort_order,
    m.id,
    i.sort_order,
    i.id;

COMMIT;

-- ============================================================
-- Результат:
--   nav_user_sections: UNIQUE(user_id, menu_id, office_id)
--   nav_user_items:    UNIQUE(user_id, menu_id, office_id)
--   admin views: 3D CROSS JOIN (user × office × item)
--   user views: фільтр через JOIN user_offices WHERE is_default = TRUE
--   тригери автопризначення: видалено (навмисно — неможливо визначити офіс)
-- ============================================================
