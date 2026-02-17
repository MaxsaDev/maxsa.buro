CREATE SCHEMA IF NOT EXISTS mx_dic;

-- ======================================================
-- ТАБЛИЦЯ МЕНЮ ПІДТРИМКИ ТА ЗВОРОТНЬОГО ЗВʼЯЗКУ ДЛЯ ЗАСТОСУНКУ
-- ======================================================
DROP TABLE IF EXISTS mx_dic.menu_app_support CASCADE;

CREATE TABLE IF NOT EXISTS mx_dic.menu_app_support
(
    id SERIAL NOT NULL PRIMARY KEY,
    menu_id  int         NOT NULL,            -- FK на меню (mx_dic.menus.id)
    title    text        NOT NULL,
    url      text        NOT NULL,
    icon     text        NOT NULL,
    is_active boolean    NOT NULL DEFAULT TRUE,

    CONSTRAINT menu_app_support_fk_menu
        FOREIGN KEY (menu_id)
        REFERENCES mx_dic.menus(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_app_support_menu_id
    ON mx_dic.menu_app_support(menu_id);

COMMENT ON TABLE mx_dic.menu_app_support IS
'Меню підтримки та зворотнього звʼязку для застосунку.';

-- Примітка: INSERT виконується після створення меню через міграцію
-- INSERT INTO mx_dic.menu_app_support (menu_id, title, url, icon, is_active) VALUES
--  (1, 'Підтримка', '/support', 'LifeBuoy', true),
--  (1, 'Зворотній звʼязок', '/feedback', 'Send', true);
