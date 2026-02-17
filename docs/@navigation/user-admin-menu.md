# Система користувацького та адміністративного меню

## Огляд

Система меню реалізована для динамічного відображення навігації в сайдбарі додатку. Меню складається з двох основних частин:

1. **Користувацьке меню** — динамічне меню, що завантажується з бази даних для кожного користувача окремо
2. **Адміністративне меню** — статичне меню, що відображається тільки для користувачів з роллю `admin`

## Архітектура

### Компоненти

#### 1. `AppSidebar` (`components/app-sidebar.tsx`)

Головний компонент сайдбару, який відображає всі типи меню:

- Користувацьке меню з секціями та простими пунктами (зверху)
- Адміністративне меню (тільки для адміністраторів, знизу)
- Меню підтримки та зворотного зв'язку (завжди знизу)
- Профіль користувача (в футері)

#### 2. `MenuProvider` (`components/menu-provider.tsx`)

Client Component, що ініціалізує та синхронізує користувацьке меню з Zustand store. Використовує:

- `useLayoutEffect` для синхронної ініціалізації перед рендером
- `useEffect` для оновлення меню при зміні даних з Server Component
- Функції порівняння для оптимізації оновлень

#### 3. `NavSections` (`components/nav-sections.tsx`)

Компонент для відображення секцій меню з підменю (collapsible). Використовує компоненти з Shadcn UI:

- `Collapsible` для розгортання/згортання секцій
- `SidebarMenuSub` для відображення підпунктів

#### 4. `NavItems` (`components/nav-items.tsx`)

Компонент для відображення простих пунктів меню без підменю.

### Типи даних

#### `MenuSection` (`lib/menu/types.ts`)

```typescript
interface MenuSection {
  title: string;
  url: string;
  icon: string; // Рядкове ім'я іконки
  isActive?: boolean;
  items?: MenuSectionItem[];
}
```

#### `MenuItem` (`lib/menu/types.ts`)

```typescript
interface MenuItem {
  id?: number;
  name: string;
  url: string;
  icon: string; // Рядкове ім'я іконки
}
```

### State Management

#### Zustand Store (`store/user-menu/user-menu-store.ts`)

Глобальний store для зберігання користувацького меню:

- `sections: MenuSection[]` — секції меню з підменю
- `items: MenuItem[]` — прості пункти меню
- `isInitialized: boolean` — прапорець ініціалізації
- `setMenu()` — встановлення меню (перша ініціалізація)
- `updateMenu()` — оновлення меню
- `clearMenu()` — очищення меню

### База даних

#### Структура таблиць

**`mx_system.nav_user_sections`** — зв'язок користувачів з секціями меню

- `user_id` — ідентифікатор користувача
- `menu_id` — ідентифікатор секції меню з `mx_dic.menu_user_sections`
- `created_by` — хто призначив меню (id користувача-адміністратора або системи)
- `is_auto_assigned` — чи було призначено автоматично через тригер при встановленні `is_default = true`
- `created_at` — дата/час призначення

**`mx_system.nav_user_items`** — зв'язок користувачів з пунктами меню

- `user_id` — ідентифікатор користувача
- `menu_id` — ідентифікатор пункту меню з `mx_dic.menu_user_items`
- `created_by` — хто призначив меню (id користувача-адміністратора або системи)
- `is_auto_assigned` — чи було призначено автоматично через тригер при встановленні `is_default = true`
- `created_at` — дата/час призначення

#### Database Views

**`mx_system.nav_user_sections_user_view`** — VIEW для отримання меню користувача з секціями

- Показує тільки дозволені та глобально активні секції
- Групує дані по категоріях
- Використовується в `buildUserMenu()` для побудови меню

**`mx_system.nav_user_items_user_view`** — VIEW для отримання пунктів меню користувача

- Показує тільки дозволені та глобально активні пункти
- Використовується в `buildUserMenu()` для побудови меню

**`mx_system.nav_user_sections_admin_view`** — VIEW для адміністративної панелі

- Показує всі секції меню з інформацією про призначення
- Використовується в компоненті `UserMenu` для управління меню

**`mx_system.nav_user_items_admin_view`** — VIEW для адміністративної панелі

- Показує всі пункти меню з інформацією про призначення
- Використовується в компоненті `UserMenu` для управління меню

### Функції роботи з даними

#### `buildUserMenu()` (`lib/menu/build-user-menu.ts`)

Server-side функція для побудови меню користувача:

1. Отримує дані з БД через `getNavUserSectionsUserViewByUserId()` та `getNavUserItemsUserViewByUserId()`
2. Групує секції по категоріях у `Map<number, MenuSection>`
3. Перетворює пункти меню в масив `MenuItem[]`
4. Повертає об'єкт з `sections` та `items`

#### `getNavUserSectionsUserViewByUserId()` (`data/mx-system/nav-user-sections.ts`)

Отримує дані секцій меню користувача з VIEW `nav_user_sections_user_view`.

#### `getNavUserItemsUserViewByUserId()` (`data/mx-system/nav-user-items.ts`)

Отримує дані пунктів меню користувача з VIEW `nav_user_items_user_view`.

#### `assignDefaultMenuToUser()` (`lib/auth/assign-default-menu.ts`)

Функція для призначення меню за замовчуванням новому користувачу при реєстрації:

1. Отримує всі активні пункти меню з `is_default = true`
2. Призначає їх користувачу з `is_auto_assigned = true`
3. Викликається автоматично в `actions/auth/register.ts` після успішної реєстрації

#### `assignDefaultMenuToAllExistingUsers()` (`lib/auth/assign-default-menu.ts`)

Функція для призначення меню за замовчуванням всім існуючим користувачам:

1. Отримує всі активні пункти меню з `is_default = true`
2. Призначає їх всім користувачам, які ще не мають цих пунктів меню
3. Використовується через Server Action `assignDefaultMenuToAllUsersAction()` для ручного призначення

### Іконки

#### `getMenuIcon()` (`lib/icon/get-menu-icon.ts`)

Функція для отримання компонента іконки з рядкового імені:

- Використовує мапу `menuIconMap` з іконками з Lucide React
- Повертає компонент іконки або `Dot` як fallback
- Дозволяє передавати рядкові назви іконок з Server Component в Client Component

## Потік даних

### Ініціалізація меню

1. **Server Component** (`app/(protected)/layout.tsx`):
   - Отримує поточного користувача через `getCurrentUser()`
   - Викликає `buildUserMenu(user.id)` для отримання меню з БД
   - Передає дані в `MenuProvider` як `initialSections` та `initialItems`

2. **MenuProvider** (`components/menu-provider.tsx`):
   - Використовує `useLayoutEffect` для синхронної ініціалізації Zustand store
   - Викликає `setMenu()` для встановлення початкового стану
   - Встановлює `isInitialized = true`

3. **AppSidebar** (`components/app-sidebar.tsx`):
   - Читає дані з Zustand store через `useUserMenuStore()`
   - Перетворює рядкові назви іконок в компоненти через `getMenuIcon()`
   - Відображає меню через `NavSections` та `NavItems`

### Оновлення меню

При зміні даних з Server Component:

1. `MenuProvider` отримує нові `initialSections` та `initialItems`
2. Порівнює з попередніми значеннями через `areSectionsEqual()` та `areItemsEqual()`
3. Якщо дані змінилися, викликає `updateMenu()` для оновлення store
4. `AppSidebar` автоматично оновлюється через підписку на Zustand store

## Адміністративне меню

Адміністративне меню визначене статично в `lib/menu.ts`:

- `navAdminSections` — секції адміністративного меню
- `navAdminItems` — прості пункти адміністративного меню

Відображається тільки для користувачів з `role === 'admin'` в `AppSidebar`.

## Структура файлів

```
components/
├── app-sidebar.tsx          # Головний компонент сайдбару
├── menu-provider.tsx        # Provider для ініціалізації меню
├── nav-items.tsx            # Компонент простих пунктів меню
├── nav-sections.tsx         # Компонент секцій меню з підменю
└── mx-admin/
    └── user-data/
        └── user-menu.tsx    # Компонент управління меню в адмін-панелі

lib/
├── menu/
│   ├── build-user-menu.ts   # Побудова меню користувача
│   └── types.ts             # Типи для меню
├── menu.ts                  # Статичні дані меню (адмін, профіль, підтримка)
└── icon/
    └── get-menu-icon.ts     # Отримання іконок з рядкових назв

store/
└── user-menu/
    └── user-menu-store.ts   # Zustand store для користувацького меню

data/
└── mx-system/
    ├── nav-user-sections.ts # Функції роботи з секціями меню
    └── nav-user-items.ts    # Функції роботи з пунктами меню

actions/
└── mx-admin/
    └── user-data/
        ├── get-user-menu-action.ts      # Server Action для отримання меню
        └── get-user-menu-data.ts        # Server Action для адмін-панелі

sql/
└── mx-system/
    ├── nav_user_sections.sql            # SQL для секцій меню
    └── nav_user_items.sql               # SQL для пунктів меню
```

## Використання

### Додавання нового пункту меню для користувача

#### Індивідуальне призначення

1. Додати запис в таблицю `mx_dic.menu_user_items` або `mx_dic.menu_user_sections`
2. Призначити меню користувачу через `insertNavUserItemsByUserId()` або `insertNavUserSectionsByUserId()`
   - Такі призначення мають `is_auto_assigned = false` (за замовчуванням)
   - Не видаляються при знятті `is_default = false`
3. Меню автоматично з'явиться в сайдбарі після оновлення сторінки

#### Меню за замовчуванням

1. Додати запис в таблицю `mx_dic.menu_user_items` або `mx_dic.menu_user_sections`
2. Встановити `is_default = true` для пункту меню через адмін-панель або напряму в БД
3. Тригер автоматично призначить меню:
   - Всім існуючим користувачам з `is_auto_assigned = true`
   - Всім новим користувачам при реєстрації через `assignDefaultMenuToUser()`
4. При знятті `is_default = false` автоматично видаляються тільки записи з `is_auto_assigned = true`

### Додавання нового пункту адміністративного меню

1. Додати запис в `lib/menu.ts` в масив `navAdminSections` або `navAdminItems`
2. Додати іконку в `lib/icon/get-menu-icon.ts` в мапу `menuIconMap` (якщо потрібно)
3. Меню автоматично з'явиться для всіх адміністраторів

### Оновлення меню після змін в адмін-панелі

#### Індивідуальне призначення меню

При зміні меню через адмін-панель (`UserMenu` компонент):

1. Викликається відповідний Server Action (`toggleUserMenuItemAction`, `toggleUserSectionMenuItemAction`)
2. Після успішного оновлення викликається `getUserMenuAction()` для отримання нового меню
3. Меню оновлюється через `MenuProvider`, який синхронізує дані з store

#### Зміна меню за замовчуванням

При встановленні/знятті `is_default` через адмін-панель (`MenuUserSections`, `MenuUserItems` компоненти):

1. Викликається Server Action (`toggleMenuUserItemsDefaultAction`, `toggleMenuUserSectionsItemsDefaultAction`)
2. Тригер бази даних автоматично:
   - При встановленні `is_default = true`: призначає меню всім користувачам з `is_auto_assigned = true`
   - При знятті `is_default = false`: видаляє тільки записи з `is_auto_assigned = true`
3. Меню автоматично оновлюється в сайдбарі всіх користувачів через `revalidatePath('/(protected)', 'layout')`

## Особливості реалізації

### Передача даних між Server та Client Components

Для передачі даних між Server та Client Components використовуються рядкові назви іконок:

- Server Component передає рядкову назву (наприклад, `"Dashboard"`)
- Client Component отримує рядкову назву та перетворює її в компонент через `getMenuIcon()`

Це дозволяє уникати серіалізації React компонентів при передачі даних.

### Оптимізація оновлень

`MenuProvider` використовує функції порівняння (`areSectionsEqual`, `areItemsEqual`) для перевірки змін перед оновленням store. Це запобігає зайвим ре-рендерам компонентів.

### Синхронна ініціалізація

Використання `useLayoutEffect` замість `useEffect` забезпечує синхронну ініціалізацію меню перед рендером, що запобігає "блиманню" меню при завантаженні сторінки.

## Відповідність правилам проекту

✅ Використання Next.js `Link` замість `<a>` для навігації
✅ Правильна групування імпортів (зовнішні → внутрішні → типи)
✅ Використання TypeScript інтерфейсів замість type aliases
✅ Коментарі українською мовою
✅ Відсутність зайвих `console.log` для відлагодження
✅ Правильне використання `displayName` для компонентів
✅ Мінімізація `'use client'` — тільки там, де потрібно
✅ Використання Zustand для глобального стану
✅ Правильна структура файлів відповідно до проекту
