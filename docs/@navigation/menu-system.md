# Система меню приложения

## Огляд

Система меню дозволяє адміністратору створювати та керувати множиною меню різних типів для користувачів. Кожне меню має власну назву, тип, порядок відображення та може містити секції з пунктами або просто пункти.

### Ключові можливості

- **Множинні меню**: Адміністратор може створювати необмежену кількість меню різних типів
- **Меню за замовчуванням**: Автоматичне призначення меню новим та існуючим користувачам через `is_default`
- **Автоматичне видалення**: При знятті `is_default` видаляються тільки автоматично призначені меню
- **Індивідуальне призначення**: Адміністратор може призначати меню окремим користувачам вручну
- **Масштабованість**: Працює автоматично для будь-якої кількості користувачів (5000+)

## Типи меню

Система підтримує два типи меню (визначені в `mx_dic.menu_types`):

1. **`sections`** - Меню з секціями та пунктами
   - Меню містить категорії (секції)
   - Кожна категорія містить пункти меню
   - Структура: Меню → Категорія → Пункт меню

2. **`items`** - Меню з пунктами
   - Меню містить тільки пункти без категорій
   - Структура: Меню → Пункт меню

## Структура бази даних

### Основні таблиці

#### `mx_dic.menu_types` - Словник типів меню

```sql
- id (smallserial PRIMARY KEY)
- code (text UNIQUE) - машинний код: 'sections', 'items'
- title (text) - локалізована назва (українська)
- sort_order (int) - порядок у селектах
- is_active (boolean) - м'яка деактивація без видалення
```

#### `mx_dic.menus` - Таблиця меню

```sql
- id (SERIAL PRIMARY KEY)
- title (text) - назва меню (видно над пунктами в сайдбарі)
- menu_type_id (smallint FK) - тип меню (sections або items)
- sort_order (int) - порядок відображення меню
- is_active (boolean) - активність меню
- created_at, updated_at (timestamptz)
```

**Автоматичне управління `sort_order`:**

- При створенні: автоматично призначається `MAX(sort_order) + 100`
- При оновленні: автоматично перерозподіляються інші меню (для drag&drop)
- При видаленні: автоматично ущільнюється порядок

#### `mx_dic.menu_user_sections_category` - Категорії меню з секціями

```sql
- id (SERIAL PRIMARY KEY)
- menu_id (int FK NOT NULL) - FK на mx_dic.menus.id
- title (text) - назва категорії
- url (text) - базовий URL категорії
- icon (text) - назва іконки
- is_active (boolean) - активність категорії
- created_at, updated_at (timestamptz)
```

#### `mx_dic.menu_user_sections_items` - Пункти меню в категоріях

```sql
- id (SERIAL PRIMARY KEY)
- category_id (int FK) - FK на menu_user_sections_category.id
- title (text) - назва пункту меню
- icon (text) - іконка пункту меню
- url (text) - URL пункту меню
- sort_order (int) - порядок сортування в межах категорії
- is_active (boolean) - активність пункту меню
- is_default (boolean) - чи призначається автоматично новим користувачам при реєстрації та всім існуючим при встановленні
- created_at, updated_at (timestamptz)
```

#### `mx_dic.menu_user_items` - Пункти меню без секцій

```sql
- id (SERIAL PRIMARY KEY)
- menu_id (int FK NOT NULL) - FK на mx_dic.menus.id
- title (text) - назва пункту меню
- icon (text) - іконка пункту меню
- url (text) - URL пункту меню
- sort_order (int) - порядок сортування
- is_active (boolean) - активність пункту меню
- is_default (boolean) - чи призначається автоматично новим користувачам при реєстрації та всім існуючим при встановленні
- created_at, updated_at (timestamptz)
```

#### `mx_dic.menu_app_support` - Меню підтримки додатку

```sql
- id (SERIAL PRIMARY KEY)
- menu_id (int FK NOT NULL) - FK на mx_dic.menus.id
- title (text) - назва пункту меню
- url (text) - URL пункту меню
- icon (text) - іконка пункту меню
- is_active (boolean) - активність пункту меню
```

**Примітка:** Меню підтримки - це єдине статичне меню типу `items`, яке завжди відображається внизу сайдбара над профілем користувача.

#### Таблиці призначення меню користувачам

##### `mx_system.nav_user_sections` - Призначення пунктів меню з секціями

```sql
- id (SERIAL PRIMARY KEY)
- user_id (text FK) - ідентифікатор користувача
- menu_id (int FK) - FK на mx_dic.menu_user_sections_items.id
- created_at (timestamptz) - дата/час надання доступу
- created_by (text FK) - хто надав доступ (id користувача-адміністратора)
- is_auto_assigned (boolean) - чи було призначено автоматично через тригер при встановленні is_default = true
```

##### `mx_system.nav_user_items` - Призначення пунктів меню без секцій

```sql
- id (SERIAL PRIMARY KEY)
- user_id (text FK) - ідентифікатор користувача
- menu_id (int FK) - FK на mx_dic.menu_user_items.id
- created_at (timestamptz) - дата/час надання доступу
- created_by (text FK) - хто надав доступ (id користувача-адміністратора)
- is_auto_assigned (boolean) - чи було призначено автоматично через тригер при встановленні is_default = true
```

**Важливо:** Поле `is_auto_assigned` використовується для відстеження автоматично призначених меню. При знятті `is_default = false` автоматично видаляються тільки записи з `is_auto_assigned = true`. Меню, призначені вручну адміністратором, залишаються без змін.

### Тригери бази даних

#### `trg_menu_user_sections_items_au_assign_default` - Тригер для меню з секціями

Автоматично спрацьовує при зміні `is_default` для пунктів меню з секціями:

- **При встановленні `is_default = true`**:
  - Призначає пункт меню всім існуючим користувачам, які ще не мають його
  - Встановлює `is_auto_assigned = true` для відстеження автоматичних призначень
  - Перевіряє активність пункту меню, категорії та меню перед призначенням

- **При знятті `is_default = false`**:
  - Видаляє тільки записи з `is_auto_assigned = true`
  - Меню, призначені вручну (`is_auto_assigned = false`), залишаються без змін

#### `trg_menu_user_items_au_assign_default` - Тригер для меню без секцій

Автоматично спрацьовує при зміні `is_default` для пунктів меню без секцій:

- **При встановленні `is_default = true`**:
  - Призначає пункт меню всім існуючим користувачам, які ще не мають його
  - Встановлює `is_auto_assigned = true` для відстеження автоматичних призначень
  - Перевіряє активність пункту меню та меню перед призначенням

- **При знятті `is_default = false`**:
  - Видаляє тільки записи з `is_auto_assigned = true`
  - Меню, призначені вручну (`is_auto_assigned = false`), залишаються без змін

**Функції тригерів:**

- `mx_dic.fn_menu_user_sections_items_au_assign_default()` - для меню з секціями
- `mx_dic.fn_menu_user_items_au_assign_default()` - для меню без секцій

### Database Views

#### `mx_system.nav_user_sections_user_view` - VIEW для користувача (секції)

Містить інформацію про меню, категорії та пункти меню з секціями для відображення в сайдбарі:

```sql
- user_id
- menu_id, menu_title, menu_sort_order
- category_id, category_title, category_url, category_icon, category_is_active
- item_id, item_title, item_icon, item_url, item_sort_order, item_is_active_global
```

#### `mx_system.nav_user_sections_admin_view` - VIEW для адміністратора (секції)

Містить повну матрицю користувач × меню × категорія × пункт меню для управління призначеннями:

```sql
- user_id, user_name
- menu_id, menu_title, menu_sort_order
- category_id, category_title, category_url, category_icon, category_is_active
- item_id, item_title, item_icon, item_url, item_sort_order, item_is_active_global
- item_is_assigned, item_is_effective_active
- nav_user_section_id, created_at, created_by
```

#### `mx_system.nav_user_items_user_view` - VIEW для користувача (пункти)

Містить інформацію про меню та пункти меню без секцій для відображення в сайдбарі:

```sql
- user_id
- menu_id, menu_title, menu_sort_order
- item_id, item_title, item_icon, item_url, item_sort_order, item_is_active_global
```

#### `mx_system.nav_user_items_admin_view` - VIEW для адміністратора (пункти)

Містить повну матрицю користувач × меню × пункт меню для управління призначеннями:

```sql
- user_id, user_name
- menu_id, menu_title, menu_sort_order
- item_id, item_title, item_icon, item_url, item_sort_order, item_is_active_global
- item_is_assigned, item_is_effective_active
- nav_user_item_id, created_at, created_by
```

## Функціонал для адміністратора

### Створення меню

Адміністратор може створювати нові меню через форму "Створити нове меню":

1. **Назва меню** - назва, яка буде відображатися над пунктами меню в сайдбарі
2. **Тип меню** - вибір між "sections" (з секціями) або "items" (тільки пункти)
3. **Іконка** - опціональна іконка для меню (не обов'язково)

Після створення меню автоматично отримує `sort_order = MAX(sort_order) + 100`.

### Редагування меню

Для кожного меню доступні операції:

- **Редагування назви** - inline редагування через `EditDbMaxsa`
- **Переключення активності** - через Switch компонент
- **Ранжування** - drag-and-drop для зміни порядку відображення
- **Видалення** - з підтвердженням через AlertDialog

### Створення категорій (для меню типу "sections")

Для меню з секціями адміністратор може створювати категорії:

1. **Назва категорії** - назва секції меню
2. **URL категорії** - базовий URL для секції
3. **Іконка категорії** - іконка для відображення секції

### Створення пунктів меню

Для кожного меню (або категорії) адміністратор може створювати пункти меню:

1. **Назва пункту** - назва пункту меню
2. **URL пункту** - URL для навігації
3. **Іконка пункту** - іконка для відображення пункту

Пункти меню автоматично отримують `sort_order = MAX(sort_order) + 100` в межах категорії або меню.

### Редагування пунктів меню

Для кожного пункту меню доступні операції:

- **Редагування назви** - inline редагування через `EditDbMaxsa`
- **Редагування URL** - inline редагування через `EditDbMaxsa`
- **Зміна іконки** - через `IconPicker` з пошуком
- **Ранжування** - drag-and-drop для зміни порядку (в межах категорії або меню)
- **Переключення активності** - через Switch компонент (`is_active`)
  - Вимкнення: меню зникає з сайдбару у всіх користувачів (через фільтр VIEW)
  - Увімкнення: меню знову з'являється у користувачів, яким воно було призначене
- **Меню за замовчуванням** - через Switch компонент (`is_default`)
  - При встановленні: автоматично призначається всім користувачам через тригер БД
  - При знятті: автоматично видаляється тільки у тих, хто отримав його автоматично (`is_auto_assigned = true`)
- **Видалення** - з підтвердженням через AlertDialog

### Визначення меню для користувачів

На сторінці користувача (`/mx-admin/user-data/[user_id]`) адміністратор може:

1. **Переглядати всі меню** - згруповані по назвах меню (`menu_title`)
2. **Призначати пункти меню** - клік по пункту меню призначає/знімає його для користувача
   - Для меню з секціями: клік по пункту меню всередині категорії
   - Для меню з пунктами: клік по пункту меню
   - Призначення зберігається в таблиці `mx_system.nav_user_items` або `mx_system.nav_user_sections`
3. **Призначати категорії** - клік по категорії призначає/знімає всі пункти в категорії для користувача
   - Для меню з секціями: клік по назві категорії призначає всі пункти меню в цій категорії

**Візуальна індикація:**

- Призначені пункти меню відображаються з активним Switch
- Непризначені пункти меню відображаються з неактивним Switch
- При зміні стану Switch автоматично оновлюється сайдбар користувача через `revalidatePath('/(protected)', 'layout')`

## Відображення в сайдбарі

### Групування по меню

Меню відображаються в сайдбарі згруповані по назвах меню:

1. **Меню з секціями** - кожне меню відображається з власною назвою
   - Назва меню відображається як label над секціями
   - Секції відображаються з підменю (collapsible)
   - Пункти меню відображаються всередині секцій

2. **Меню з пунктами** - кожне меню відображається з власною назвою
   - Назва меню відображається як label над пунктами
   - Пункти меню відображаються списком

3. **Меню підтримки** - єдине меню внизу сайдбара
   - Завжди відображається над профілем користувача
   - Містить тільки активні пункти меню

### Порядок відображення

Меню відображаються в порядку, визначеному `sort_order`:

- Спочатку меню з найменшим `sort_order`
- Всередині меню - категорії та пункти в порядку їх `sort_order`

## Структура файлів

### SQL схеми

```
sql/
├── mx_dic/
│   ├── menu_types.sql              # Словник типів меню
│   ├── menus.sql                   # Таблиця меню
│   ├── menus_fn.sql                # Функції та тригери для sort_order
│   ├── menu_user_sections.sql      # Таблиці меню з секціями
│   ├── menu_user_items.sql         # Таблиця меню з пунктами
│   ├── menu_app_support.sql        # Таблиця меню підтримки
│   └── menu_default_fn.sql         # Функції та тригери для автоматичного призначення меню за замовчуванням
├── mx-system/
│   ├── nav_user_sections.sql       # Таблиця призначення меню з секціями та VIEW
│   └── nav_user_items.sql          # Таблиця призначення меню без секцій та VIEW
└── migrations/
    ├── 001_menu_system_add_menu_id.sql
    ├── 002_menu_system_migrate_existing_data.sql
    ├── 003_menu_system_add_menu_info_to_views.sql
    ├── 004_menu_system_add_is_default.sql
    └── 005_menu_system_add_is_auto_assigned.sql
```

### TypeScript інтерфейси

```
interfaces/mx-dic/
├── menu-types.ts                   # MenuType
├── menus.ts                        # Menu
├── menu-user-sections.ts          # MenuUserSectionsCategory, MenuUserSectionsItems
├── menu-user-items.ts             # MenuUserItems
└── menu-app-support.ts            # MenuAppSupport

interfaces/mx-system/
├── nav-user-sections.ts           # NavUserSectionsAdminView, NavUserSectionsUserView
└── nav-user-items.ts              # NavUserItemsAdminView, NavUserItemsUserView
```

### Data layer

```
data/mx-dic/
├── menus.ts                        # Функції роботи з меню (CRUD, reorder)
└── menu-admin.ts                  # Функції роботи з пунктами меню (CRUD, is_default)

data/mx-system/
├── nav-user-sections.ts           # Функції отримання даних з VIEW та призначення меню
└── nav-user-items.ts              # Функції отримання даних з VIEW та призначення меню

lib/auth/
└── assign-default-menu.ts         # Функції призначення меню за замовчуванням новим та існуючим користувачам
```

### Server Actions

```
actions/mx-admin/menu/
├── menus.ts                        # CRUD операції для меню
├── create-menu-items.ts            # Створення пунктів меню
├── update-menu-fields.ts           # Оновлення полів (title, url, icon)
├── toggle-menu-active.ts           # Переключення активності (is_active)
├── toggle-menu-default.ts          # Переключення меню за замовчуванням (is_default)
├── assign-default-menu-to-all.ts   # Призначення меню за замовчуванням всім існуючим користувачам
└── delete-menu-items.ts            # Видалення пунктів меню

actions/auth/
└── register.ts                     # Реєстрація користувача (викликає assignDefaultMenuToUser)
```

### Компоненти

```
components/mx-admin/menu/
├── menu-tabs-wrapper.tsx           # Обгортка для Tabs
├── menu-user-sections.tsx          # Компонент меню з секціями
├── menu-user-items.tsx             # Компонент меню з пунктами
├── menu-app-support.tsx            # Компонент меню підтримки
├── create-menu-form.tsx            # Форма створення меню
├── sortable-menu-card.tsx          # Картка меню з drag&drop
├── sortable-menu-wrapper.tsx       # Обгортка для drag&drop пунктів
└── add-menu-item-form.tsx         # Форма додавання пунктів меню
```

## Порядок виконання міграцій

Для нової установки виконайте файли в такому порядку:

```sql
-- 1. Створення словника типів меню
\i sql/mx_dic/menu_types.sql

-- 2. Створення таблиці меню
\i sql/mx_dic/menus.sql

-- 3. Створення функцій та тригерів для автоматичного управління sort_order
\i sql/mx_dic/menus_fn.sql

-- 4. Створення таблиць меню з новою структурою
\i sql/mx_dic/menu_user_sections.sql
\i sql/mx_dic/menu_user_items.sql
\i sql/mx_dic/menu_app_support.sql

-- 5. Створення таблиць призначення меню користувачам та VIEW для навігації
\i sql/mx-system/nav_user_sections.sql
\i sql/mx-system/nav_user_items.sql

-- 6. Створення функцій та тригерів для автоматичного призначення меню за замовчуванням
\i sql/mx_dic/menu_default_fn.sql
```

Для існуючої бази даних виконайте міграції:

```sql
-- 1-3. Створення нових таблиць (як вище)

-- 4. Додавання поля menu_id до існуючих таблиць
\i sql/migrations/001_menu_system_add_menu_id.sql

-- 5. Міграція існуючих даних
\i sql/migrations/002_menu_system_migrate_existing_data.sql

-- 6. Оновлення VIEW
\i sql/migrations/003_menu_system_add_menu_info_to_views.sql

-- 7. Додавання поля is_default та триггерів для автоматичного призначення
\i sql/migrations/004_menu_system_add_is_default.sql

-- 8. Додавання поля is_auto_assigned для відстеження автоматичних призначень
\i sql/migrations/005_menu_system_add_is_auto_assigned.sql
```

## Приклади використання

### Створення меню з секціями

1. Адміністратор натискає "Створити нове меню"
2. Вводить назву: "Основне меню"
3. Вибирає тип: "Меню з секціями та пунктами"
4. Після створення може додавати категорії та пункти меню

### Створення меню з пунктами

1. Адміністратор натискає "Створити нове меню"
2. Вводить назву: "Швидкий доступ"
3. Вибирає тип: "Меню з пунктами"
4. Після створення може додавати пункти меню без категорій

### Призначення меню користувачу

#### Індивідуальне призначення

1. Адміністратор переходить на сторінку користувача (`/mx-admin/user-data/[user_id]`)
2. Бачить всі меню, згруповані по назвах
3. Клікає по пункту меню або категорії для призначення/зняття
4. Меню автоматично з'являється/зникає в сайдбарі користувача
5. Такі призначення мають `is_auto_assigned = false` і не видаляються при знятті `is_default`

#### Меню за замовчуванням

1. Адміністратор переходить на сторінку управління меню (`/mx-admin/menu-app`)
2. Встановлює Switch "Меню за замовчуванням" для потрібного пункту меню
3. Меню автоматично призначається:
   - Всім існуючим користувачам через тригер бази даних
   - Всім новим користувачам при реєстрації
4. При знятті Switch "Меню за замовчуванням":
   - Автоматично видаляються тільки записи з `is_auto_assigned = true`
   - Меню, призначені вручну, залишаються без змін
