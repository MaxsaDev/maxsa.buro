CREATE SCHEMA IF NOT EXISTS mx_dic;
-- -------------------------------------------------
-- Категорії повноважень користувача (верхній рівень)
-- -------------------------------------------------
DROP TABLE IF EXISTS mx_dic.user_permissions_category CASCADE;

CREATE TABLE IF NOT EXISTS mx_dic.user_permissions_category
(
    id          SERIAL PRIMARY KEY,          -- унікальний ідентифікатор категорії
    title       text        NOT NULL,        -- назва категорії (наприклад: "Каса")
    description text,                        -- опис категорії
    icon        text        NOT NULL DEFAULT 'CircleCheck', -- назва іконки (frontend)
    is_active   boolean     NOT NULL DEFAULT TRUE -- глобальна активність категорії
);


INSERT INTO mx_dic.user_permissions_category (title, description, icon, is_active) VALUES
 ('Призначення', 'Призначення працівників та виконавців', 'CircleCheck', true);
