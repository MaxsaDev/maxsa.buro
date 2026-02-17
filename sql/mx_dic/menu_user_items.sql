-- =========================================================
-- ШАБЛОН МЕНЮ КОРИСТУВАЧА (БЕЗ КАТЕГОРІЙ)
-- =========================================================
DROP TABLE IF EXISTS mx_dic.menu_user_items CASCADE;

CREATE TABLE IF NOT EXISTS mx_dic.menu_user_items
(
    id          SERIAL      PRIMARY KEY,          -- унікальний ідентифікатор пункту меню
    menu_id     int         NOT NULL,            -- FK на меню (mx_dic.menus.id)
    title       text        NOT NULL,            -- назва пункту меню (наприклад: "Розрахунки готівкою")
    icon        text        NOT NULL,            -- іконка пункту меню (клас/нейм для фронтенду)
    url         text        NOT NULL,            -- URL пункту меню
    sort_order  int         NOT NULL DEFAULT 100,-- порядок сортування в загальному списку
    is_active   boolean     NOT NULL DEFAULT TRUE, -- глобальна активність пункту меню
    is_default  boolean     NOT NULL DEFAULT FALSE, -- чи призначається автоматично новим користувачам

    CONSTRAINT menu_user_items_fk_menu
        FOREIGN KEY (menu_id)
        REFERENCES mx_dic.menus(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_user_items_is_default
    ON mx_dic.menu_user_items(is_default)
    WHERE is_default = true;

COMMENT ON COLUMN mx_dic.menu_user_items.is_default IS
    'Якщо true, пункт меню автоматично призначається новим користувачам при реєстрації та всім існуючим користувачам при встановленні';

CREATE INDEX IF NOT EXISTS idx_menu_user_items_menu_id
    ON mx_dic.menu_user_items(menu_id);


-- Примітка: INSERT виконується після створення меню через міграцію
-- INSERT INTO mx_dic.menu_user_items (menu_id, title, icon, url, sort_order, is_active, is_default) VALUES
--  (1, 'Перший пункт', 'Dashboard', '/dashboard', 100, true, false),
--  (1, 'Другий пункт', 'Profile', '/profile', 200, true, false);

-- =========================================================
-- Створення функцій та триггерів для автоматичного призначення
-- меню за замовчуванням всім існуючим користувачам
-- =========================================================
-- Примітка: Функції та тригери вже створені в menu_user_sections.sql
-- Якщо виконується тільки цей файл, розкоментуйте наступний рядок:
-- \i sql/mx_dic/menu_default_fn.sql
