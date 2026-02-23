# Система меню

## Огляд

Система меню дозволяє адміністратору створювати та керувати множиною меню різних типів для користувачів. Кожне меню має власну назву, тип, порядок відображення та може містити секції з пунктами або просто пункти.

## Типи меню

Система підтримує три типи меню (визначені в `mx_dic.menu_types`):

| Код        | Назва           | Структура                | Прив'язка до офісу |
| ---------- | --------------- | ------------------------ | ------------------ |
| `sections` | Меню з секціями | Меню → Категорія → Пункт | Так                |
| `items`    | Меню з пунктами | Меню → Пункт             | Так                |
| `general`  | Загальне меню   | Меню → Пункт             | Ні                 |

**sections** і **items** — офісні меню. Доступ до пункту залежить від того, для якого офісу він призначений користувачу. У сайдбарі відображається поточний (default) офіс.

**general** — меню без прив'язки до офісу. Пункти відображаються завжди, незалежно від вибраного офісу.

---

## Структура бази даних

### Словникові таблиці (`mx_dic`)

#### `mx_dic.menu_types` — типи меню

```sql
id          smallserial PRIMARY KEY
code        text UNIQUE          -- 'sections', 'items', 'general'
title       text                 -- локалізована назва
sort_order  int
is_active   boolean
```

#### `mx_dic.menus` — таблиця меню

```sql
id              SERIAL PRIMARY KEY
title           text             -- назва над пунктами в сайдбарі
menu_type_id    smallint FK      -- FK → mx_dic.menu_types
sort_order      int              -- автоматично MAX+100 при створенні
is_active       boolean
created_at, updated_at  timestamptz
```

`sort_order` управляється тригерами автоматично (при створенні, оновленні, видаленні).

#### `mx_dic.menu_user_sections_category` — категорії (для типу sections)

```sql
id          SERIAL PRIMARY KEY
menu_id     int FK              -- FK → mx_dic.menus
title       text
url         text
icon        text
is_active   boolean
```

#### `mx_dic.menu_user_sections_items` — пункти меню в категоріях

```sql
id          SERIAL PRIMARY KEY
category_id int FK              -- FK → menu_user_sections_category
title       text
icon        text
url         text
sort_order  int
is_active   boolean
is_default  boolean             -- пункт видно у всіх офісах без явного призначення
```

#### `mx_dic.menu_user_items` — пункти меню без секцій

```sql
id          SERIAL PRIMARY KEY
menu_id     int FK              -- FK → mx_dic.menus
title       text
icon        text
url         text
sort_order  int
is_active   boolean
is_default  boolean             -- пункт видно у всіх офісах без явного призначення
```

#### `mx_dic.menu_general_items` — пункти загального меню

```sql
id          SERIAL PRIMARY KEY
menu_id     int FK              -- FK → mx_dic.menus (type='general')
title       text
icon        text
url         text
sort_order  int
is_active   boolean
is_default  boolean             -- пункт видно всім користувачам без явного призначення
```

#### `mx_dic.menu_app_support` — меню підтримки (статичне)

```sql
id          SERIAL PRIMARY KEY
menu_id     int FK
title       text
url         text
icon        text
is_active   boolean
```

Єдине статичне меню — завжди відображається внизу сайдбару над профілем. Не потребує призначень.

---

### Таблиці призначень (`mx_system`)

#### `mx_system.nav_user_sections` — призначення пунктів з секціями

```sql
id          SERIAL PRIMARY KEY
user_id     text FK             -- FK → public."user"
menu_id     int FK              -- FK → menu_user_sections_items.id
office_id   int FK              -- FK → mx_dic.offices
created_at  timestamptz
created_by  text FK
is_auto_assigned  boolean       -- зарезервовано, не використовується активно
UNIQUE (user_id, menu_id, office_id)
```

#### `mx_system.nav_user_items` — призначення пунктів без секцій

```sql
-- Ідентична структура до nav_user_sections
UNIQUE (user_id, menu_id, office_id)
```

#### `mx_system.nav_user_general` — призначення пунктів загального меню

```sql
id          SERIAL PRIMARY KEY
user_id     text FK             -- FK → public."user"
menu_id     int FK              -- FK → menu_general_items.id
created_at  timestamptz
created_by  text FK
UNIQUE (user_id, menu_id)       -- без office_id
```

---

### Database Views

#### Принцип `is_default` у Views

`is_default = true` реалізується виключно на рівні SQL View — тригери для автоматичного запису в таблиці призначень **не використовуються** (були вимкнені через неоднозначність `office_id`).

**Для офісних меню** (`nav_user_sections_user_view`, `nav_user_items_user_view`):

```sql
SELECT DISTINCT ON (u.id, i.id) ...
FROM public."user" u
JOIN mx_system.user_offices uo ON uo.user_id = u.id AND uo.is_default = TRUE
CROSS JOIN mx_dic.menu_user_items i          -- всі пункти меню
JOIN mx_dic.menus m ON m.id = i.menu_id
WHERE m.is_active = TRUE AND i.is_active = TRUE
  AND (
      -- явно призначено для поточного офісу
      EXISTS (
          SELECT 1 FROM mx_system.nav_user_items nui
          WHERE nui.user_id = u.id AND nui.menu_id = i.id AND nui.office_id = uo.office_id
      )
      OR
      -- або загальнодоступний — видно у всіх офісах
      i.is_default = TRUE
  )
```

Пункт з `is_default = true` видно у **будь-якому поточному офісі** без запису в `nav_user_items`/`nav_user_sections`.

**Для загального меню** (`nav_user_general_user_view`):

```sql
SELECT DISTINCT ON (u.id, i.id) ...
FROM public."user" u
CROSS JOIN mx_dic.menu_general_items i
JOIN mx_dic.menus m ON m.id = i.menu_id
WHERE m.is_active = TRUE AND i.is_active = TRUE
  AND (
      EXISTS (SELECT 1 FROM mx_system.nav_user_general nug
              WHERE nug.user_id = u.id AND nug.menu_id = i.id)
      OR i.is_default = TRUE
  )
```

Пункт з `is_default = true` видно **всім користувачам** без будь-яких записів у `nav_user_general`.

#### Admin views (`*_admin_view`)

CROSS JOIN матриця `user × office × item` (або `user × item` для general). Повертає всі можливі комбінації, для кожної `item_is_assigned = (record IS NOT NULL)`. Фільтрація за `user_id` і `office_id[]` — в TypeScript-запиті.

---

## Поле `is_default` — семантика

| Тип меню             | `is_default = true` означає                         |
| -------------------- | --------------------------------------------------- |
| `sections` / `items` | Пункт видно у **всіх офісах** поточного користувача |
| `general`            | Пункт видно **всім користувачам** системи           |

`is_default` — це ознака "публічного за замовчуванням". Вона не записує дані в таблиці призначень і не потребує тригерів. Логіка реалізована у View.

---

## Функціонал адміністратора

### Конструктор меню (`/mx-admin/menu-app`)

Вкладки: **Секції** | **Пункти** | **Загальне** | **Підтримка**

**Для кожного меню:**

- Inline редагування назви
- Перемикач активності (`is_active`)
- Drag-and-drop для порядку
- Видалення з підтвердженням

**Для кожного пункту меню:**

- Inline редагування назви та URL
- Вибір іконки через `IconPicker`
- Drag-and-drop для порядку в межах категорії/меню
- Перемикач активності (`is_active`) — вимкнений пункт зникає з сайдбару для всіх
- Перемикач `is_default` (зірочка) — активний пункт видно без явного призначення

### Призначення меню користувачу (`/mx-admin/user-data/[user_id]`)

Вкладки: **Меню** | **Загальне**

**Вкладка "Меню"** — офісні секції та пункти:

- Ліва панель: мультиселект офісів (один або декілька)
- Права панель: пункти меню з бейджами офісів
- Single-office режим: клік перемикає для одного офісу
- Multi-office режим: клік перемикає для всіх вибраних офісів одночасно (алгоритм "найменшого знаменника")
- Клік на категорію — bulk toggle всіх пунктів категорії

**Вкладка "Загальне"** — пункти загального меню:

- Список всіх пунктів загального меню
- Клік призначає/знімає для конкретного користувача
- Пункти з `is_default = true` — видні незалежно від призначення (позначені візуально)

---

## Структура файлів

### SQL

```
sql/mx_dic/
├── menu_types.sql              # Словник типів меню
├── menus.sql                   # Таблиця меню
├── menus_fn.sql                # Тригери sort_order
├── menu_user_sections.sql      # Категорії + пункти секційного меню
├── menu_user_items.sql         # Пункти плоского меню
├── menu_general_items.sql      # Пункти загального меню
└── menu_app_support.sql        # Пункти меню підтримки

sql/mx_system/
├── nav_user_sections.sql       # Призначення sections + обидва Views
├── nav_user_items.sql          # Призначення items + обидва Views
└── nav_user_general.sql        # Призначення general + обидва Views

sql/migrations/
├── 001–007_*.sql               # Поступова еволюція схеми (додавання office_id тощо)
├── 008_general_menu.sql        # Загальне меню: таблиці + Views
├── 009_general_menu_is_default_view.sql  # is_default для general у View
└── 010_menu_is_default_for_all_offices.sql  # is_default для sections/items у Views
```

### TypeScript

```
interfaces/mx-dic/
├── menus.ts
├── menu-types.ts
├── menu-user-sections.ts       # MenuUserSectionsCategory, MenuUserSectionsItems
├── menu-user-items.ts          # MenuUserItems
├── menu-general-items.ts       # MenuGeneralItems
└── menu-app-support.ts

interfaces/mx-system/
├── nav-user-sections.ts        # NavUserSectionsAdminView, NavUserSectionsUserView
├── nav-user-items.ts           # NavUserItemsAdminView, NavUserItemsUserView
└── nav-user-general.ts         # NavUserGeneralAdminView, NavUserGeneralUserView

data/mx-dic/
├── menus.ts                    # CRUD меню
├── menu-admin.ts               # CRUD пунктів (sections, items)
└── menu-general.ts             # CRUD пунктів загального меню

data/mx-system/
├── nav-user-sections.ts
├── nav-user-items.ts
└── nav-user-general.ts

actions/mx-admin/menu/
├── create-menu-items.ts
├── update-menu-fields.ts
├── toggle-menu-active.ts
├── toggle-menu-default.ts      # is_default для sections, items, general
└── delete-menu-items.ts

components/mx-admin/menu/
├── menu-tabs-wrapper.tsx       # Контейнер вкладок конструктора
├── menu-user-sections.tsx      # Конструктор секційного меню
├── menu-user-items.tsx         # Конструктор плоского меню
├── menu-general.tsx            # Конструктор загального меню
└── menu-app-support.tsx        # Конструктор меню підтримки
```

---

## Порядок виконання міграцій

### Нова БД

```bash
psql -d your_db -f sql/migrations/clear_database_create_db_for_new_app.sql
```

### Жива БД (покрокова)

```bash
psql -d your_db -f sql/migrations/001_menu_system_add_menu_id.sql
psql -d your_db -f sql/migrations/002_menu_system_migrate_existing_data.sql
psql -d your_db -f sql/migrations/003_menu_system_add_menu_info_to_views.sql
psql -d your_db -f sql/migrations/004_menu_system_add_is_default.sql
psql -d your_db -f sql/migrations/005_menu_system_add_is_auto_assigned.sql
psql -d your_db -f sql/migrations/006_user_offices_add_is_default.sql
psql -d your_db -f sql/migrations/007_nav_menu_add_office_id.sql
psql -d your_db -f sql/migrations/008_general_menu.sql
psql -d your_db -f sql/migrations/009_general_menu_is_default_view.sql
psql -d your_db -f sql/migrations/010_menu_is_default_for_all_offices.sql
```
