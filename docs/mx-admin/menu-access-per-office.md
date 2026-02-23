# Меню користувача з прив'язкою до офісу

## 1. Задача і проблема, яку вирішує

**Проблема:** Система прав доступу до меню не враховувала офіс. Один запис у БД (`nav_user_sections`, `nav_user_items`) означав доступ до пункту меню в усіх офісах одночасно. Це унеможливлювало сценарій коли один і той самий співробітник має повний доступ до меню в офісі А, але лише до фінансових пунктів в офісі Б.

**Рішення:** Додати `office_id` як третій вимір до системи прав доступу до меню. Ключ стає `(user_id, menu_id, office_id)` замість `(user_id, menu_id)`.

**Бізнес-сценарій:**

- Іваненко (бухгалтер, всі офіси) → при `"Обрати всі"` + клік на категорію "Фінанси" → доступ активується у 3 офісах одночасно
- Петренко (менеджер) → Тернопіль: повний доступ, Львів: тільки "Клієнти"
- Сидоренко (локальний співробітник) → Херсон: обмежений доступ, до інших офісів не призначений

---

## 2. Технологічний стек

| Технологія                    | Роль у модулі                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| **PostgreSQL 17**             | UNIQUE(user_id, menu_id, office_id), SQL Views, CROSS JOIN матриці                  |
| **Next.js 16 App Router**     | Server Actions (`'use server'`), `revalidatePath` для cache invalidation            |
| **React 19 + React Compiler** | Client компонент `UserMenu`, без `useMemo`/`useCallback`                            |
| **TypeScript 5 (strict)**     | Інтерфейси для всіх View і таблиць, нуль `any`                                      |
| **`pg` (node-postgres)**      | Прямий SQL, parameterized queries, connection pool                                  |
| **Shadcn UI / Radix UI**      | `Item`, `ItemGroup`, `ItemActions`, `Tooltip`, `Button`                             |
| **Tailwind CSS 4**            | Утилітарні класи, CSS-змінні для semantic кольорів (`text-success`, `text-warning`) |
| **Sonner**                    | Toast-сповіщення після операцій                                                     |

---

## 3. Архітектурні рішення

### 3.1 Тривимірна модель доступу

```
nav_user_sections / nav_user_items
  └── UNIQUE(user_id, menu_id, office_id)

Запис існує → доступ є для цього user + menu + office
Запис відсутній → доступу немає
```

Немає поля `is_active` — наявність/відсутність запису і є станом.

### 3.2 Два типи SQL Views

**Admin view** (`*_admin_view`) — 3D CROSS JOIN матриця:

```sql
FROM public."user" u
CROSS JOIN mx_dic.offices o
CROSS JOIN mx_dic.menus m
JOIN menu_items i ON ...
LEFT JOIN nav_user_sections nus ON nus.user_id=u.id AND nus.office_id=o.id AND nus.menu_id=i.id
```

Повертає **всі можливі комбінації** user × office × item. Для кожної комбінації `item_is_assigned = (nus.id IS NOT NULL)`. Фільтрація за конкретним `user_id` і `office_id[]` відбувається в TypeScript-запиті, не у View.

**User view** (`*_user_view`) — фільтр за поточним офісом з підтримкою `is_default`:

```sql
FROM public."user" u
JOIN mx_system.user_offices uo
  ON uo.user_id = u.id
 AND uo.is_default = TRUE
CROSS JOIN mx_dic.menu_user_items i  -- або menu_user_sections_items
JOIN mx_dic.menus m ON m.id = i.menu_id
WHERE m.is_active = TRUE AND i.is_active = TRUE
  AND (
    -- явно призначено для поточного офісу
    EXISTS (
      SELECT 1 FROM mx_system.nav_user_items nui
      WHERE nui.user_id = u.id AND nui.menu_id = i.id AND nui.office_id = uo.office_id
    )
    OR
    -- або позначено як загальнодоступне — видно у всіх офісах
    i.is_default = TRUE
  )
```

Повертає пункти меню **поточного (default) офісу** користувача — і явно призначені для цього офісу, і пункти з `is_default = true` (вони видні у всіх офісах). Коли `OfficeSwitcher` змінює default → `revalidatePath('/(protected)', 'layout')` → layout ре-рендериться → `buildUserMenu` перечитує view → сайдбар оновлюється **автоматично без змін у layout**.

### 3.3 Bulk операції з ідемпотентністю

```sql
INSERT INTO nav_user_sections (user_id, menu_id, office_id, created_by)
VALUES ($1, $2, $3, $4), ($1, $5, $6, $4), ...
ON CONFLICT (user_id, menu_id, office_id) DO NOTHING
```

`ON CONFLICT DO NOTHING` робить bulk insert **ідемпотентним**: можна викликати повторно без помилок. Це критично для multi-office режиму коли деякі пункти вже призначені.

### 3.4 UX-алгоритм мультиофісного перемикання

**"Найменший спільний знаменник" (bulk-toggle):**

```
Дано: itemId, selectedOfficeIds[], sourceData[]

allAssigned = selectedOfficeIds.every(officeId =>
  sourceData.some(d => d.item_id === itemId && d.office_id === officeId && d.item_is_assigned)
)

targetState = !allAssigned

// Якщо не всі активні → активуємо всіх
// Якщо всі активні → знімаємо всіх
```

Аналогічно для категорій — перевірка по всіх items категорії × всіх вибраних офісах.

**Візуальний стан рядка (мультиофісний режим):**

| `allAssigned` | `someAssigned` | Клас рядка                       | Клас іконки                                    |
| ------------- | -------------- | -------------------------------- | ---------------------------------------------- |
| `true`        | `true`         | `menu-active-item`               | `menu-active-media-success`                    |
| `false`       | `true`         | `border-warning/30 bg-warning/5` | `border-warning/20 bg-warning/10 text-warning` |
| `false`       | `false`        | `hover:bg-muted/50`              | —                                              |

**Бейджи** (2 літери офісу) — лише **індикатори** (`<span>`, не `<Button>`):

- `text-success` — офіс має доступ
- `text-muted-foreground` — офіс не має доступу
- Tooltip: `"{office_title}: активно/неактивно"`

### 3.5 Два режими роботи компонента

| Умова                          | Режим         | Поведінка кліку на рядок                                       |
| ------------------------------ | ------------- | -------------------------------------------------------------- |
| `selectedOfficeIds.size === 1` | Single-office | `toggleUserSectionMenuItemAction` / `toggleUserMenuItemAction` |
| `selectedOfficeIds.size > 1`   | Multi-office  | `handleMultiOfficeItemToggle` → `bulkToggleMenuItemsAction`    |

### 3.6 processingIds — оптимістична блокування UI

```typescript
// Ключі для дедублювання concurrent запитів:
'section-{itemId}-{officeId}'; // single-office item
'item-{itemId}-{officeId}'; // single-office flat item
'sections-bulk-{itemId}'; // multi-office section item
'items-bulk-{itemId}'; // multi-office flat item
'category-{categoryId}'; // bulk категорія
```

Якщо запит ще виконується → `pointer-events-none opacity-50` на елемент, повторний клік ігнорується.

---

## 4. Структура файлів і їх роль

### 4.1 База даних

#### `sql/mx_system/nav_user_sections.sql`

Канонічна схема таблиці `mx_system.nav_user_sections` + 2 View.

**Таблиця:**

```sql
CREATE TABLE mx_system.nav_user_sections (
  id         SERIAL PRIMARY KEY,
  user_id    text        NOT NULL,  -- FK → public."user"(id)
  menu_id    int         NOT NULL,  -- FK → mx_dic.menu_user_sections_items(id)
  office_id  int         NOT NULL,  -- FK → mx_dic.offices(id)
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by text        NOT NULL,  -- FK → public."user"(id)
  CONSTRAINT nav_user_sections_user_menu_office_unique UNIQUE (user_id, menu_id, office_id),
  CONSTRAINT nav_user_sections_fk_office FOREIGN KEY (office_id) REFERENCES mx_dic.offices(id) ON DELETE CASCADE
);
CREATE INDEX idx_nav_user_sections_user_office ON nav_user_sections(user_id, office_id);
```

**Views:** `nav_user_sections_admin_view` (CROSS JOIN матриця), `nav_user_sections_user_view` (CROSS JOIN + EXISTS OR is_default)

#### `sql/mx_system/nav_user_items.sql`

Ідентична структура для flat-items меню (без категорій). Таблиця `mx_system.nav_user_items` + `nav_user_items_admin_view` + `nav_user_items_user_view` (CROSS JOIN + EXISTS OR is_default).

#### `sql/migrations/007_nav_menu_add_office_id.sql`

Міграція для живої БД. Порядок операцій (критично!):

```
1. DROP тригери автопризначення (вони INSERT без office_id → сломаються)
2. DROP всі залежні VIEW (перед ALTER TABLE — інакше PG блокує зміну схеми)
3. ALTER TABLE nav_user_sections: DROP CONSTRAINT старий UNIQUE, ADD COLUMN office_id, SET NOT NULL, ADD FK, ADD новий UNIQUE, CREATE INDEX
4. ALTER TABLE nav_user_items: ті ж самі кроки
5. CREATE нові VIEW (admin + user для обох таблиць)
6. DROP функції автопризначення
```

> ⚠️ **Правило для міграцій:** Всі `DROP` — першими, потім `ALTER`/`CREATE`. PostgreSQL не дозволяє `CREATE OR REPLACE VIEW` якщо нові колонки з'являються не в кінці — треба `DROP` + `CREATE`.

---

### 4.2 TypeScript Interfaces

#### `interfaces/mx-system/nav-user-sections.ts`

```typescript
// Сирий запис таблиці
interface NavUserSections {
  id: number;
  user_id: string;
  menu_id: number;
  office_id: number; // ← ключова колонка
  created_at: Date;
  created_by: string;
}

// Для адмін-панелі (з Admin View)
interface NavUserSectionsAdminView {
  user_id: string;
  user_name: string;
  office_id: number;
  office_title: string; // ← офіс
  menu_id: number;
  menu_title: string;
  menu_sort_order: number;
  category_id: number;
  category_title: string;
  category_url: string;
  category_icon: string;
  category_is_active: boolean;
  item_id: number;
  item_title: string;
  item_icon: string;
  item_url: string;
  item_sort_order: number;
  item_is_active_global: boolean;
  item_is_assigned: boolean; // ← чи є запис у таблиці
  item_is_effective_active: boolean; // ← item_is_assigned AND всі is_active
  nav_user_section_id: number | null;
  created_at: Date | null;
  created_by: string | null;
}

// Для сайдбару (з User View)
interface NavUserSectionsUserView {
  user_id: string;
  office_id: number; // ← поточний default офіс
  menu_id: number;
  menu_title: string;
  menu_sort_order: number;
  category_id: number;
  category_title: string;
  category_url: string;
  category_icon: string;
  category_is_active: boolean;
  item_id: number;
  item_title: string;
  item_icon: string;
  item_url: string;
  item_sort_order: number;
  item_is_active_global: boolean;
}
```

#### `interfaces/mx-system/nav-user-items.ts`

Ідентична структура без `category_*` полів (flat menu без категорій).

---

### 4.3 Data Functions

#### `data/mx-system/nav-user-sections.ts`

| Функція                                       | Сигнатура                                     | Призначення              |
| --------------------------------------------- | --------------------------------------------- | ------------------------ |
| `getNavUserSectionsAdminViewByUserAndOffices` | `(userId, officeIds[])`                       | Читання для адмін-панелі |
| `insertNavUserSectionsByUserAndOffice`        | `(userId, menuId, officeId, createdBy)`       | Одиночне призначення     |
| `deleteNavUserSectionsByUserAndOffice`        | `(userId, menuId, officeId)`                  | Одиночне зняття          |
| `bulkInsertNavUserSections`                   | `(userId, menuIds[], officeIds[], createdBy)` | Масове призначення N×M   |
| `bulkDeleteNavUserSections`                   | `(userId, menuIds[], officeIds[])`            | Масове зняття N×M        |
| `getNavUserSectionsUserViewByUserId`          | `(userId)`                                    | Читання для сайдбару     |

**Bulk insert — алгоритм побудови параметрів:**

```typescript
// Для menuIds = [10, 11], officeIds = [1, 2]:
// params = [userId, createdBy, 10, 1, 10, 2, 11, 1, 11, 2]
// valueTuples = ['($1,$3,$4,$2)', '($1,$5,$6,$2)', '($1,$7,$8,$2)', '($1,$9,$10,$2)']

let paramIdx = 3;
for (const menuId of menuIds) {
  for (const officeId of officeIds) {
    valueTuples.push(`($1, $${paramIdx}, $${paramIdx + 1}, $2)`);
    params.push(menuId, officeId);
    paramIdx += 2;
  }
}
```

**Bulk delete — параметри:**

```typescript
// menuParams = '$2,$3', officeParams = '$4,$5'
const menuParams = menuIds.map((_, i) => `$${i + 2}`).join(', ');
const officeParams = officeIds.map((_, i) => `$${menuIds.length + i + 2}`).join(', ');
// sql: WHERE user_id=$1 AND menu_id IN ($2,$3) AND office_id IN ($4,$5)
```

Всі write-операції обгорнуті в `BEGIN/COMMIT/ROLLBACK`.

#### `data/mx-system/nav-user-items.ts`

Ідентичні функції для flat-items (`nav_user_items`).

---

### 4.4 Server Actions

#### `actions/mx-admin/user-data/get-user-menu-data.ts`

```typescript
getUserMenuDataAction(userId: string, officeIds: number[])
  → Promise<{ sections: NavUserSectionsAdminView[], items: NavUserItemsAdminView[] }>
```

- Перевіряє авторизацію (тільки `role === 'admin'`)
- Якщо `officeIds.length === 0` → повертає `{ sections: [], items: [] }` без запитів до БД
- Паралельно завантажує обидва типи меню через `Promise.all`

#### `actions/mx-admin/user-data/toggle-user-section-menu-item.ts`

```typescript
toggleUserSectionMenuItemAction(userId, menuId, officeId, isActive)
  → Promise<ActionStatus>
```

- `isActive = true` → `insertNavUserSectionsByUserAndOffice`
- `isActive = false` → `deleteNavUserSectionsByUserAndOffice`
- `revalidatePath('/mx-admin/user-data/${userId}')` + `revalidatePath('/(protected)', 'layout')`

#### `actions/mx-admin/user-data/toggle-user-menu-item.ts`

Ідентично для flat-items.

#### `actions/mx-admin/user-data/bulk-toggle-menu-items.ts`

```typescript
bulkToggleMenuItemsAction(
  userId: string,
  menuIds: number[],
  officeIds: number[],
  isActive: boolean,
  type: 'sections' | 'items'
) → Promise<ActionStatus>
```

- `type` визначає яку таблицю змінювати
- `isActive = true` → `bulkInsert*`, `false` → `bulkDelete*`
- Toast-повідомлення містить кількість: `"Доступ активовано для N пунктів у M філіях"`

**`ActionStatus` interface:**

```typescript
interface ActionStatus {
  status: 'success' | 'error';
  message: string;
  code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'DB_ERROR' | 'UNKNOWN_ERROR';
}
```

---

### 4.5 UI Component

#### `components/mx-admin/user-data/user-menu.tsx`

**Client component** (`'use client'`). Розміщується на вкладці "Меню" сторінки `/mx-admin/user-data/[user_id]`.

**State:**

```typescript
assignedOffices: UserOfficeAdminView[]   // всі офіси призначені користувачу
selectedOfficeIds: Set<number>           // вибрані офіси (мультиселект)
sectionsData: NavUserSectionsAdminView[] // дані меню з секціями для вибраних офісів
itemsData: NavUserItemsAdminView[]       // flat-items для вибраних офісів
isLoadingOffices: boolean
isLoadingMenu: boolean
processingIds: Set<string>              // ключі активних запитів для блокування
```

**Структура layout:**

```
<div className="flex gap-6">
  ├── Ліва панель (w-60 shrink-0)      — мультиселект офісів
  └── Права панель (flex-1 min-w-0)    — пункти меню
```

**Ліва панель — логіка "Обрати всі":**

```typescript
const allSelected =
  assignedOffices.length > 0 && assignedOffices.every((o) => selectedOfficeIds.has(o.office_id));
const someSelected = selectedOfficeIds.size > 0 && !allSelected;

// Іконка: allSelected → Check, someSelected → Minus, інакше → Building2
// handleSelectAll: allSelected → очищає Set, інакше → додає всіх
```

**Права панель — групування даних:**

Для sections — 2-рівнева ієрархія: `Menu → Category → Items[]`

```typescript
interface MenuGroup {
  menuId;
  menuTitle;
  menuSortOrder;
  categories: CategoryGroup[];
}
interface CategoryGroup {
  categoryId;
  categoryTitle;
  categoryIcon;
  categoryIsActive;
  items: NavUserSectionsAdminView[]; // дедуплікуються за item_id
}
```

Дедублікація важлива — при мультиофісному режимі View повертає по одному рядку на кожну комбінацію item × office:

```typescript
if (!catGroup.items.some((i) => i.item_id === item.item_id)) {
  catGroup.items.push(item);
}
```

Для items — 1-рівнева ієрархія: `Menu → Items[]` (без категорій).

**Обробники подій:**

```typescript
// Single-office: клік на рядок item
handleSectionItemClick(item: NavUserSectionsAdminView)
  → toggleUserSectionMenuItemAction(userId, item.item_id, item.office_id, !item.item_is_assigned)

handleMenuItemClick(item: NavUserItemsAdminView)
  → toggleUserMenuItemAction(userId, item.item_id, item.office_id, !item.item_is_assigned)

// Multi-office: клік на рядок item
handleMultiOfficeItemToggle(itemId: number, type: 'sections' | 'items')
  // Обчислює allAssigned, потім:
  → bulkToggleMenuItemsAction(userId, [itemId], selectedOfficeIdsArr, !allAssigned, type)

// Клік на категорію (завжди bulk)
handleCategoryClick(category: CategoryGroup)
  // menuIds = category.items.map(i => i.item_id)
  // allAssigned = всі items × всі офіси мають доступ
  → bulkToggleMenuItemsAction(userId, menuIds, selectedOfficeIdsArr, !allAssigned, 'sections')
```

**`getOfficeBadgeLabel` — утиліта для скорочення назви офісу:**

```typescript
const getOfficeBadgeLabel = (office: UserOfficeAdminView): string =>
  ((office.office_city ?? office.office_title) || '??').slice(0, 2).toUpperCase();
// "Львів" → "ЛВ", "Київ" → "КИ"
```

**Повний список імпортів:**

```typescript
import { Building2, Check, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { bulkToggleMenuItemsAction } from '@/actions/mx-admin/user-data/bulk-toggle-menu-items';
import { getUserMenuDataAction } from '@/actions/mx-admin/user-data/get-user-menu-data';
import { getUserOfficesDataAction } from '@/actions/mx-admin/user-data/get-user-offices-data';
import { toggleUserMenuItemAction } from '@/actions/mx-admin/user-data/toggle-user-menu-item';
import { toggleUserSectionMenuItemAction } from '@/actions/mx-admin/user-data/toggle-user-section-menu-item';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { NavUserItemsAdminView } from '@/interfaces/mx-system/nav-user-items';
import type { NavUserSectionsAdminView } from '@/interfaces/mx-system/nav-user-sections';
import type { UserOfficeAdminView } from '@/interfaces/mx-system/user-offices';
import { getMenuIcon } from '@/lib/icon/get-menu-icon';
```

---

## 5. Інтеграція в новий проєкт — покрокова інструкція

### Крок 1: Передумови в БД

Модуль залежить від:

- `public."user"` — таблиця користувачів (Better Auth)
- `mx_dic.offices` — таблиця офісів з полями `id`, `title`, `city`, `sort_order`, `is_active`
- `mx_dic.menus` — таблиця меню
- `mx_dic.menu_user_sections_category` — категорії меню
- `mx_dic.menu_user_sections_items` — пункти меню з секціями (FK → category)
- `mx_dic.menu_user_items` — flat пункти меню (FK → menu)
- `mx_system.user_offices` — таблиця призначення офісів користувачам, обов'язково з полем `is_default boolean`

### Крок 2: Виконати SQL

```bash
# Нова БД:
psql -d your_db -f sql/mx_system/nav_user_sections.sql
psql -d your_db -f sql/mx_system/nav_user_items.sql

# Жива БД (міграція):
psql -d your_db -f sql/migrations/007_nav_menu_add_office_id.sql
```

### Крок 3: Створити TypeScript інтерфейси

Скопіювати `interfaces/mx-system/nav-user-sections.ts` та `interfaces/mx-system/nav-user-items.ts`.

### Крок 4: Створити data functions

Скопіювати `data/mx-system/nav-user-sections.ts` та `data/mx-system/nav-user-items.ts`. Замінити `pool` на свій connection pool (з `@/lib/db`).

### Крок 5: Створити server actions

Скопіювати 4 файли з `actions/mx-admin/user-data/`:

- `get-user-menu-data.ts`
- `toggle-user-section-menu-item.ts`
- `toggle-user-menu-item.ts`
- `bulk-toggle-menu-items.ts`

Перевірити що `getCurrentUser()` та `ActionStatus` адаптовані до вашого auth.

### Крок 6: Підключити компонент

```tsx
// На сторінці /mx-admin/user-data/[user_id]
import { UserMenu } from '@/components/mx-admin/user-data/user-menu';

// Всередині компоненту вкладки "Меню":
<UserMenu userId={userId} />;
```

`UserMenu` сам завантажує всі дані (офіси, меню) через useEffect → server actions.

### Крок 7: Сайдбар — оновлення при зміні офісу

У функції `buildUserMenu` (або аналогічній) де будується меню сайдбару:

```typescript
// Використовувати User View — вона сама фільтрує за is_default:
const sections = await getNavUserSectionsUserViewByUserId(userId);
const items = await getNavUserItemsUserViewByUserId(userId);
```

У `OfficeSwitcher` після зміни офісу:

```typescript
revalidatePath('/(protected)', 'layout');
// або відповідний шлях до layout з сайдбаром
```

---

## 6. Типові помилки та ловушки

### SQL

**❌ `CREATE OR REPLACE VIEW` при зміні порядку/назв колонок**

```
ERROR: cannot change name of view column "menu_id" to "office_id"
```

→ PostgreSQL вважає зміну позиції колонки перейменуванням. Завжди: `DROP VIEW IF EXISTS` + `CREATE VIEW`.

**❌ `ALTER TABLE` при наявних залежних VIEW**

```
ERROR: cannot change name of view column...
```

→ Необхідно `DROP VIEW` **до** будь-яких `ALTER TABLE`. Порядок у міграції: `DROP VIEW → DROP TRIGGERS → ALTER TABLE → CREATE VIEW`.

**❌ `ADD COLUMN NOT NULL` без DEFAULT на непорожній таблиці**
→ PostgreSQL відмовить якщо є рядки. Рішення: ADD COLUMN nullable → заповнити дані → SET NOT NULL. Або DELETE невалідних рядків перед SET NOT NULL (як у міграції 007).

**❌ `BEGIN` у IDE (DataGrip, Neon Console)**
→ Деякі клієнти автоматично відкривають транзакцію. Якщо файл містить `BEGIN;` — може виникнути конфлікт. Рішення: виконати `ROLLBACK;` вручну якщо транзакція "завісла", потім знову запустити файл.

### TypeScript

**❌ Дублікати при групуванні (мультиофісний режим)**
→ View повертає N рядків на item (по одному на офіс). При reduce без дедублікації кожен item з'являється N разів.

```typescript
// Обов'язково:
if (!catGroup.items.some((i) => i.item_id === item.item_id)) {
  catGroup.items.push(item);
}
```

**❌ Stale closure в `reloadMenuData`**
→ `reloadMenuData` читає `selectedOfficeIds` через closure. Якщо викликати після `setSelectedOfficeIds` — прочитає старе значення. Реалізація через `useEffect` на `selectedOfficeIds` вирішує це.

**❌ `processingIds` race condition**
→ Без перевірки `if (processingIds.has(key)) return` два швидкі кліки можуть відправити два запити. Перевірка на початку кожного обробника обов'язкова.

### UX

**❌ Bulk-toggle без алгоритму "найменшого знаменника"**
→ Якщо клік просто перемикає стан — адмін не розуміє що станеться при частково-призначеному стані. Алгоритм: якщо не всі → активувати всіх, якщо всі → зняти всіх.

**❌ Клікабельні бейджи в мультиофісному режимі**
→ Якщо бейдж перемикає тільки один офіс → суперечить очікуванню "я вибрав кілька офісів → хочу змінити для всіх". Бейджи мають бути тільки індикаторами (`<span>`, не `<Button>`).

---

## 7. Залежності між модулями

```
БД (PostgreSQL)
  nav_user_sections / nav_user_items
  ├── nav_user_sections_admin_view  ← читається у data/
  ├── nav_user_sections_user_view   ← читається у buildUserMenu (сайдбар)
  ├── nav_user_items_admin_view     ← читається у data/
  └── nav_user_items_user_view      ← читається у buildUserMenu (сайдбар)

data/ (SQL queries)
  nav-user-sections.ts ←→ interfaces/mx-system/nav-user-sections.ts
  nav-user-items.ts    ←→ interfaces/mx-system/nav-user-items.ts

actions/ (Server Actions)
  get-user-menu-data.ts      → data/nav-user-sections + data/nav-user-items
  toggle-user-section-*.ts   → data/nav-user-sections
  toggle-user-menu-item.ts   → data/nav-user-items
  bulk-toggle-menu-items.ts  → data/nav-user-sections + data/nav-user-items
  [всі] → revalidatePath → Next.js cache

components/
  user-menu.tsx
    → actions/get-user-menu-data          (завантаження даних)
    → actions/get-user-offices-data       (список офісів)
    → actions/toggle-user-section-*       (single-office toggle)
    → actions/toggle-user-menu-item       (single-office toggle)
    → actions/bulk-toggle-menu-items      (multi-office + category toggle)
    → interfaces/ (типізація)
    → lib/icon/get-menu-icon              (іконки з lucide-react)

Сайдбар (layout)
  buildUserMenu()
    → data/getNavUserSectionsUserViewByUserId
    → data/getNavUserItemsUserViewByUserId
    [автоматично оновлюється через revalidatePath після будь-якої зміни меню або зміни офісу]
```
