CREATE SCHEMA IF NOT EXISTS mx_dic;
-- -------------------------------------------------
-- Категорії меню користувача (верхній рівень меню)
-- -------------------------------------------------
DROP TABLE IF EXISTS mx_dic.menu_user_sections_category CASCADE;

CREATE TABLE IF NOT EXISTS mx_dic.menu_user_sections_category
(
    id         SERIAL PRIMARY KEY,          -- унікальний ідентифікатор категорії
    menu_id    int         NOT NULL,        -- FK на меню (mx_dic.menus.id)
    title      text        NOT NULL,        -- назва категорії (наприклад: "Каса")
    url        text        NOT NULL,        -- базовий URL для категорії (якщо використовується)
    icon       text        NOT NULL,        -- назва іконки (frontend)
    is_active  boolean     NOT NULL DEFAULT TRUE, -- глобальна активність категорії

    CONSTRAINT menu_user_sections_category_fk_menu
        FOREIGN KEY (menu_id)
        REFERENCES mx_dic.menus(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_user_sections_category_menu_id
    ON mx_dic.menu_user_sections_category(menu_id);


-- Примітка: INSERT виконується після створення меню через міграцію
-- INSERT INTO mx_dic.menu_user_sections_category (menu_id, title, url, icon, is_active) VALUES
--  (1, 'Перший розділ', '/dashboard', 'Dashboard', true),
--  (1, 'Другий розділ', '/profile', 'Profile', true);

-- -------------------------------------------------
-- Пункти меню користувача (елементи всередині категорій)
-- -------------------------------------------------
DROP TABLE IF EXISTS mx_dic.menu_user_sections_items CASCADE;

CREATE TABLE IF NOT EXISTS mx_dic.menu_user_sections_items
(
    id          SERIAL      PRIMARY KEY,    -- унікальний ідентифікатор пункту меню
    category_id int         NOT NULL,       -- FK на категорію меню
    title       text        NOT NULL,       -- назва пункту меню (наприклад: "розрахунки готівкою")
    icon        text        NOT NULL,       -- іконка пункту меню
    url         text        NOT NULL,       -- URL пункту меню
    sort_order  int         NOT NULL DEFAULT 100, -- порядок сортування в межах категорії
    is_active   boolean     NOT NULL DEFAULT TRUE, -- глобальна активність пункту меню
    is_default  boolean     NOT NULL DEFAULT FALSE, -- чи призначається автоматично новим користувачам

    CONSTRAINT menu_user_sections_items_fk_category
        FOREIGN KEY (category_id)
        REFERENCES mx_dic.menu_user_sections_category(id)
        ON DELETE CASCADE                       -- при видаленні категорії видаляємо всі її пункти
);

CREATE INDEX IF NOT EXISTS idx_menu_user_sections_items_is_default
    ON mx_dic.menu_user_sections_items(is_default)
    WHERE is_default = true;

COMMENT ON COLUMN mx_dic.menu_user_sections_items.is_default IS
    'Якщо true, пункт меню автоматично призначається новим користувачам при реєстрації та всім існуючим користувачам при встановленні';

INSERT INTO mx_dic.menu_user_sections_items (category_id, title, icon, url, sort_order, is_active, is_default) VALUES
 (1, 'Перший пункт', 'Dashboard', '/dashboard', 100, true, false),
 (1, 'Другий пункт', 'Profile', '/profile', 200, true, false),
 (2, 'Перший пункт', 'Dashboard', '/dashboard', 100, true, false),
 (2, 'Другий пункт', 'Profile', '/profile', 200, true, false);

-- =========================================================
-- Створення функцій та триггерів для автоматичного призначення
-- меню за замовчуванням всім існуючим користувачам
-- =========================================================
\i sql/mx_dic/menu_default_fn.sql

