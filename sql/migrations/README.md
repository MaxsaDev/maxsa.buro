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

#### 004_menu_system_add_is_default.sql

Додає поле `is_default` до таблиць пунктів меню:

- `mx_dic.menu_user_sections_items.is_default` — позначає пункт меню як "за замовчуванням"
- `mx_dic.menu_user_items.is_default` — аналогічно для flat-items
- Адміністратор може позначити пункти, які автоматично призначаються новим користувачам

#### 005_menu_system_add_is_auto_assigned.sql

Додає поле `is_auto_assigned` до таблиць призначення меню:

- `mx_system.nav_user_sections.is_auto_assigned` — true якщо призначено через тригер
- `mx_system.nav_user_items.is_auto_assigned` — аналогічно
- Дозволяє відрізнити автоматично призначені пункти від ручних, щоб автоматично знімати при `is_default = false`

#### 006_user_offices_add_is_default.sql

Додає поле `is_default` до `mx_system.user_offices`:

- Дозволяє визначити один офіс як "поточний" для кожного користувача
- Тригери забезпечують цілісність: рівно один офіс може бути `is_default = true` на користувача
- Використовується для фільтрації меню в сайдбарі (показує меню поточного офісу)

#### 007_nav_menu_add_office_id.sql

Прив'язка прав доступу до меню до конкретного офісу:

- Вимикає тригери автопризначення меню (INSERT без `office_id` несумісний із новою схемою)
- Додає `office_id int NOT NULL` до `nav_user_sections` та `nav_user_items`
- Замінює `UNIQUE(user_id, menu_id)` → `UNIQUE(user_id, menu_id, office_id)` в обох таблицях
- Додає `FOREIGN KEY (office_id) REFERENCES mx_dic.offices(id) ON DELETE CASCADE`
- Оновлює admin-в'юхи: 3D-матриця `user × office × menu_item` (CROSS JOIN offices)
- Оновлює user-в'юхи: `JOIN user_offices WHERE is_default = TRUE` для фільтрації за поточним офісом
- Видаляє функції та тригери автопризначення (`fn_menu_user_*_au_assign_default`)

#### 008_general_menu.sql

Додає "загальне меню" — функціонал, що відображається в сайдбарі **завжди**, незалежно від вибраного офісу:

- Додає новий тип меню `general` до `mx_dic.menu_types`
- Створює `mx_dic.menu_general_items` — словник пунктів загального меню (аналог `menu_user_items`, але без прив'язки до офісу)
- Створює `mx_system.nav_user_general` — призначення пунктів загального меню конкретним користувачам; `UNIQUE(user_id, menu_id)` без `office_id`
- Створює `nav_user_general_admin_view` — 2D-матриця для адмін-панелі (user × menu_general_items)
- Створює `nav_user_general_user_view` — відфільтровані пункти для сайдбару (без фільтрації за офісом)

## Порядок виконання для запуску проєкту

### Варіант А: Чиста база даних (новий проєкт)

Виконати один файл — він містить повний актуальний стан БД:

```bash
psql -d your_database -f sql/migrations/clear_database_create_db_for_new_app.sql
npm run dev
```

### Варіант Б: Жива база даних (накатити зміни)

Виконати тільки ту міграцію, якої ще немає в БД. Для функціоналу прив'язки меню до офісів це міграція **007**:

```bash
psql -d your_database -f sql/migrations/007_nav_menu_add_office_id.sql
npm run dev
```

> Міграція обгорнута в `BEGIN/COMMIT` — якщо щось піде не так, транзакція відкотиться автоматично.

Після запуску у розділі `/mx-admin/user-data/[user_id]` → вкладка "Меню" буде доступний двопанельний інтерфейс: вибір офісів зліва, призначення пунктів меню справа.

### Міграції 008–010: Загальне меню та is_default

| Файл                                      | Опис                                                                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `008_general_menu.sql`                    | Нові таблиці `menu_general_items`, `nav_user_general`, view для загального меню (без прив'язки до офісу)                                                                     |
| `009_general_menu_is_default_view.sql`    | Оновлення `nav_user_general_user_view`: пункти з `is_default = true` видно всім користувачам без явного призначення                                                          |
| `010_menu_is_default_for_all_offices.sql` | Оновлення `nav_user_items_user_view` та `nav_user_sections_user_view`: пункти з `is_default = true` видно в усіх офісах користувача без явного призначення для кожного офісу |

```bash
psql -d your_database -f sql/migrations/008_general_menu.sql
psql -d your_database -f sql/migrations/009_general_menu_is_default_view.sql
psql -d your_database -f sql/migrations/010_menu_is_default_for_all_offices.sql
```

### Повна послідовність міграцій (якщо потрібно накатити з нуля по кроках)

```bash
psql -d your_database -f sql/migrations/001_menu_system_add_menu_id.sql
psql -d your_database -f sql/migrations/002_menu_system_migrate_existing_data.sql
psql -d your_database -f sql/migrations/003_menu_system_add_menu_info_to_views.sql
psql -d your_database -f sql/migrations/004_menu_system_add_is_default.sql
psql -d your_database -f sql/migrations/005_menu_system_add_is_auto_assigned.sql
psql -d your_database -f sql/migrations/006_user_offices_add_is_default.sql
psql -d your_database -f sql/migrations/007_nav_menu_add_office_id.sql
psql -d your_database -f sql/migrations/008_general_menu.sql
psql -d your_database -f sql/migrations/009_general_menu_is_default_view.sql
psql -d your_database -f sql/migrations/010_menu_is_default_for_all_offices.sql
npm run dev
```
