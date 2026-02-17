# SQL Міграції бази даних

Ця папка містить файли міграцій для оновлення структури бази даних.

## Порядок виконання міграцій

Міграції виконуються послідовно за номером у назві файлу.

### Міграції системи меню

#### 001_menu_system_add_menu_id.sql

Додає поле `menu_id` до існуючих таблиць меню:

- `mx_dic.menu_user_sections_category`
- `mx_dic.menu_user_items`
- `mx_dic.menu_app_support`

**Важливо:** Після виконання цієї міграції обов'язково виконайте міграцію 002 для заповнення даних.

#### 002_menu_system_migrate_existing_data.sql

Міграція існуючих даних до нової структури:

1. Створює перші меню для кожного типу (sections, items)
2. Призначає існуючі дані до цих меню
3. Додає зовнішні ключі та обмеження NOT NULL

#### 003_menu_system_add_menu_info_to_views.sql

Оновлює VIEW для включення інформації про меню:

- Додає `menu_id`, `menu_title`, `menu_sort_order` до всіх VIEW
- Оновлює `nav_user_sections_user_view`, `nav_user_sections_admin_view`
- Оновлює `nav_user_items_user_view`, `nav_user_items_admin_view`

## Виконання міграцій

```bash
# Виконання всіх міграцій послідовно
psql -d your_database -f sql/migrations/001_menu_system_add_menu_id.sql
psql -d your_database -f sql/migrations/002_menu_system_migrate_existing_data.sql
psql -d your_database -f sql/migrations/003_menu_system_add_menu_info_to_views.sql
```

Або через psql інтерактивно:

```sql
\i sql/migrations/001_menu_system_add_menu_id.sql
\i sql/migrations/002_menu_system_migrate_existing_data.sql
\i sql/migrations/003_menu_system_add_menu_info_to_views.sql
```
