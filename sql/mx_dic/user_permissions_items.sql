CREATE SCHEMA IF NOT EXISTS mx_dic;
-- -------------------------------------------------
-- Пункти повноважень користувача (елементи всередині категорій)
-- -------------------------------------------------
DROP TABLE IF EXISTS mx_dic.user_permissions_items CASCADE;

CREATE TABLE IF NOT EXISTS mx_dic.user_permissions_items
(
    id          SERIAL      PRIMARY KEY,    -- унікальний ідентифікатор пункту повноваження
    category_id int         NOT NULL,       -- FK на категорію повноважень
    title       text        NOT NULL,       -- назва пункту повноваження (наприклад: "Операції з готівкою")
    description text,                       -- опис пункту повноваження
    sort_order  int         NOT NULL DEFAULT 100, -- порядок сортування в межах категорії
    is_active   boolean     NOT NULL DEFAULT TRUE, -- глобальна активність пункту повноваження

    CONSTRAINT user_permissions_items_fk_category
        FOREIGN KEY (category_id)
        REFERENCES mx_dic.user_permissions_category(id)
        ON DELETE CASCADE                       -- при видаленні категорії видаляємо всі її пункти
);

INSERT INTO mx_dic.user_permissions_items (category_id, title, description, sort_order, is_active) VALUES
 (1, 'Створення категорій документації', 'Дозволяє створювати категорії документації', 100, true),
 (1, 'Створення розділів документації', 'Дозволяє створювати розділи документації', 200, true),
 (1, 'Створення статей документації', 'Дозволяє створювати статті документації', 300, true);
