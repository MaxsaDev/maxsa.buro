CREATE SCHEMA IF NOT EXISTS mx_dic;

-- =========================================================
-- ПУНКТИ ЗАГАЛЬНОГО МЕНЮ (БЕЗ КАТЕГОРІЙ, БЕЗ ПРИВ'ЯЗКИ ДО ОФІСУ)
-- Відображається в сайдбарі завжди, незалежно від вибраного офісу
-- =========================================================
DROP TABLE IF EXISTS mx_dic.menu_general_items CASCADE;

CREATE TABLE IF NOT EXISTS mx_dic.menu_general_items
(
    id          SERIAL      PRIMARY KEY,          -- унікальний ідентифікатор пункту меню
    menu_id     int         NOT NULL,            -- FK на меню (mx_dic.menus.id)
    title       text        NOT NULL,            -- назва пункту меню
    icon        text        NOT NULL,            -- іконка пункту меню (рядкова назва для фронтенду)
    url         text        NOT NULL,            -- URL пункту меню
    sort_order  int         NOT NULL DEFAULT 100,-- порядок сортування в загальному списку
    is_active   boolean     NOT NULL DEFAULT TRUE, -- глобальна активність пункту меню
    is_default  boolean     NOT NULL DEFAULT FALSE, -- зарезервовано для майбутнього автопризначення

    CONSTRAINT menu_general_items_fk_menu
        FOREIGN KEY (menu_id)
        REFERENCES mx_dic.menus(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_general_items_menu_id
    ON mx_dic.menu_general_items(menu_id);

CREATE INDEX IF NOT EXISTS idx_menu_general_items_is_default
    ON mx_dic.menu_general_items(is_default)
    WHERE is_default = true;

COMMENT ON TABLE mx_dic.menu_general_items IS
'Пункти загального меню. Відображаються в сайдбарі завжди, незалежно від вибраного офісу.';

COMMENT ON COLUMN mx_dic.menu_general_items.is_default IS
    'Зарезервовано для майбутнього автопризначення. Поки не використовується.';
