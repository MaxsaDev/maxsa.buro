# Відображення меню в сайдбарі

## Огляд

Сайдбар відображає чотири типи навігації:

1. **Офісне меню з секціями** — динамічне, залежить від офісу (`nav_user_sections_user_view`)
2. **Офісне меню з пунктами** — динамічне, залежить від офісу (`nav_user_items_user_view`)
3. **Загальне меню** — завжди видно, незалежно від офісу (`nav_user_general_user_view`)
4. **Адміністративне меню** — статичне, тільки для `role === 'admin'`
5. **Меню підтримки** — статичне, завжди внизу

---

## Архітектура

### Потік даних

```
layout.tsx (Server Component)
  └── buildUserMenu(userId)
        ├── getNavUserSectionsUserViewByUserId()   → MenuSection[]
        ├── getNavUserItemsUserViewByUserId()      → MenuItem[]
        └── getNavUserGeneralUserViewByUserId()    → MenuGeneralItem[]
              ↓
        MenuProvider (Client Component)
              ↓ useLayoutEffect (синхронна ініціалізація)
        useUserMenuStore (Zustand)
              ↓
        AppSidebar (Client Component)
              ↓
        NavSections / NavItems / NavGeneral
```

### Оновлення сайдбару

При будь-якій зміні (призначення меню, зміна офісу):

```typescript
revalidatePath('/(protected)', 'layout');
```

Next.js ре-рендерить layout → `buildUserMenu` перечитує Views → `MenuProvider` отримує нові дані → Zustand store оновлюється → сайдбар оновлюється.

---

## Компоненти

### `AppSidebar` (`components/app-sidebar.tsx`)

Головний компонент сайдбару. Читає дані з Zustand store через `useUserMenuStore()`.

Структура рендеру:

```
AppSidebar
├── [офісне меню з секціями]    NavSections
├── [офісне меню з пунктами]    NavItems
├── [загальне меню]              NavGeneral (або аналог)
├── [адмін меню, якщо admin]    NavSections / NavItems
└── footer
    ├── [меню підтримки]         NavItems
    └── UserProfile
```

### `MenuProvider` (`components/menu-provider.tsx`)

Client Component, що ініціалізує та синхронізує меню з Zustand store.

- `useLayoutEffect` — синхронна ініціалізація перед рендером (без "блимання")
- `useEffect` — оновлення при зміні даних з Server Component
- `areSectionsEqual` / `areItemsEqual` — порівняння для уникнення зайвих ре-рендерів

### `NavSections` (`components/nav-sections.tsx`)

Collapsible секції меню (Меню → Категорія → Пункти). Використовує `Collapsible` + `SidebarMenuSub` з Shadcn UI.

### `NavItems` (`components/nav-items.tsx`)

Плоский список пунктів без категорій.

---

## Zustand Store

`store/user-menu/user-menu-store.ts`

```typescript
interface UserMenuStore {
  sections: MenuSection[]; // офісне меню з секціями
  items: MenuItem[]; // офісне меню без секцій
  generalItems: MenuGeneralItem[]; // загальне меню (завжди видно)
  isInitialized: boolean;
  setMenu(sections, items, generalItems): void;
  updateMenu(sections, items, generalItems): void;
  clearMenu(): void;
}
```

---

## Типи (`lib/menu/types.ts`)

```typescript
interface MenuSection {
  title: string;
  url: string;
  icon: string; // рядкове ім'я іконки (не компонент)
  isActive?: boolean;
  items?: MenuSectionItem[];
}

interface MenuItem {
  id?: number;
  name: string;
  url: string;
  icon: string;
}

interface MenuGeneralItem {
  id: number;
  name: string;
  url: string;
  icon: string;
}
```

> Іконки передаються як рядки між Server і Client Component, перетворюються через `getMenuIcon()` (`lib/icon/get-menu-icon.ts`).

---

## `buildUserMenu` (`lib/menu/build-user-menu.ts`)

```typescript
export async function buildUserMenu(userId: string) {
  const [sectionsData, itemsData, generalData] = await Promise.all([
    getNavUserSectionsUserViewByUserId(userId),
    getNavUserItemsUserViewByUserId(userId),
    getNavUserGeneralUserViewByUserId(userId),
  ]);

  // sections: групування Menu → Category → Items[]
  // items: групування Menu → Items[]
  // general: плоский список MenuGeneralItem[]
  return { sections, items, generalItems };
}
```

View повертає вже відфільтровані пункти (активні + призначені або `is_default = true`). `buildUserMenu` лише перетворює плоскі рядки у вкладену структуру.

---

## Адміністративне меню

Визначене статично в `lib/menu.ts`:

- `navAdminSections` — секції адмін-меню
- `navAdminItems` — прості пункти адмін-меню

Відображається тільки для `role === 'admin'`. Не потребує БД.

Для додавання нового пункту: редагувати `lib/menu.ts` напряму.

---

## Іконки

`getMenuIcon(iconName: string)` (`lib/icon/get-menu-icon.ts`) — перетворює рядкову назву іконки у компонент Lucide React. Fallback: `Dot`.

Для додавання нової іконки — додати до `menuIconMap` у цьому файлі.

---

## Структура файлів

```
components/
├── app-sidebar.tsx
├── menu-provider.tsx
├── nav-sections.tsx
└── nav-items.tsx

lib/
├── menu/
│   ├── build-user-menu.ts
│   └── types.ts
├── menu.ts                     # Статичні дані адмін-меню
└── icon/
    └── get-menu-icon.ts

store/
└── user-menu/
    └── user-menu-store.ts

data/mx-system/
├── nav-user-sections.ts
├── nav-user-items.ts
└── nav-user-general.ts
```
