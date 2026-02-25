# Office Switcher — Перемикач офісів у шапці сайдбара

## 1. Задача і проблема, яку вирішує

**Проблема:** Сайдбар завжди показував статичний блок з назвою застосунку "MAXSA BURO". Після введення системи офісів (філій) стало необхідним показувати активний офіс користувача та надати можливість швидкого перемикання між офісами прямо з сайдбара, не заходячи в налаштування.

**Рішення:** Умовне відображення у шапці сайдбара (`<SidebarHeader>`):

- На сторінках `/mx-admin/*` або коли користувачу не призначено жодного офісу → статичний блок "MAXSA BURO"
- На клієнтських сторінках при 1+ призначених офісах → інтерактивний `OfficeSwitcher` (dropdown)

**Побічний ефект (безкоштовно):** Зміна дефолтного офісу через `OfficeSwitcher` автоматично оновлює меню сайдбара — `nav_user_*_user_view` фільтрує пункти меню за `is_default = TRUE`, тому після `revalidatePath` layout перечитує меню для нового офісу.

---

## 2. Технологічний стек

| Технологія                    | Роль у модулі                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------- |
| **PostgreSQL 17**             | View `user_offices_user_view` — фільтрує тільки призначені та активні офіси       |
| **Next.js 16 App Router**     | Server Component layout завантажує офіси; `revalidatePath` для cache invalidation |
| **React 19 + React Compiler** | Без `useMemo`/`useCallback` — компілятор оптимізує сам                            |
| **`useTransition`**           | Виконання server action без блокування UI (оптимістичне оновлення)                |
| **`usePathname`**             | Визначення поточного маршруту для умовного рендерингу                             |
| **Shadcn UI / Radix UI**      | `DropdownMenu`, `SidebarMenu`, `SidebarMenuButton`, `SidebarMenuItem`             |
| **Lucide React**              | Іконки `Building2`, `ChevronsUpDown`, `Check`                                     |
| **`pg` (node-postgres)**      | Прямий SQL-запит до PostgreSQL через connection pool                              |
| **TypeScript 5 (strict)**     | Типізація через наявний `UserOfficeUserView` інтерфейс                            |

---

## 3. Архітектурні рішення та паттерни

### 3.1 Умовний рендеринг за маршрутом

Перевірка виконується на клієнті через `usePathname()`. Це необхідно тому що `AppSidebar` — `'use client'` компонент і не може перевіряти URL на сервері.

```
isAdminRoute = pathname.startsWith('/mx-admin')

!isAdminRoute && userOffices.length > 0
  → <OfficeSwitcher />          (клієнтська частина + є офіси)
  → статичний блок "Maxsa Buro"  (адмін або немає офісів)
```

### 3.2 Оптимістичне оновлення + відкат

Компонент оновлює `selectedOffice` **до** завершення server action. Якщо action повертає `status: 'error'` — UI відкочується до попереднього стану. Це дає миттєву відповідь UI без затримки мережі.

```
клік → setSelectedOffice(office)     ← оптимістично
     → startTransition(action)        ← в фоні
     → якщо error → setSelectedOffice(previousOffice)
```

### 3.3 Потік даних: Server → Client

Дані офісів завантажуються **один раз** у Server Component (`layout.tsx`) і передаються як props. Компонент не робить клієнтських запитів при монтуванні. Оновлення даних — через `revalidatePath` після мутації.

```
layout.tsx (Server Component)
  → getUserOfficesUserViewByUserId(user.id)   [PostgreSQL]
  → <AppSidebar userOffices={userOffices} />  [prop drilling]
  → <OfficeSwitcher offices={userOffices} />  [client state]
```

### 3.4 Зв'язок з меню сайдбара

`user_offices_user_view` → фільтрує офіси за `is_default = TRUE`.
`nav_user_sections_user_view` / `nav_user_items_user_view` → фільтрують меню за `uo.is_default = TRUE`.

Коли `OfficeSwitcher` змінює default офіс в БД та викликає `revalidatePath('/(protected)', 'layout')`:

1. Next.js інвалідує кеш layout
2. При наступній навігації layout ре-рендериться на сервері
3. `buildUserMenu()` перечитує user_view → отримує меню для нового офісу
4. Сайдбар відображає оновлене меню

### 3.5 Розподіл відповідальності (Separation of Concerns)

| Шар       | Файл                                       | Відповідальність                                      |
| --------- | ------------------------------------------ | ----------------------------------------------------- |
| БД        | `user_offices_user_view`                   | Фільтрація офісів (тільки assigned + active)          |
| Data      | `data/mx-system/user-offices.ts`           | SQL-запит, типізація                                  |
| Action    | `actions/profile/set-my-default-office.ts` | Авторизація + мутація + revalidation                  |
| Component | `components/office-switcher.tsx`           | UI, стан, оптимістичне оновлення                      |
| Layout    | `app/(protected)/layout.tsx`               | Завантаження даних, передача в sidebar                |
| Sidebar   | `components/app-sidebar.tsx`               | Умовний рендеринг OfficeSwitcher або статичного блоку |

---

## 4. База даних

### View: `mx_system.user_offices_user_view`

Вже існує в `sql/mx_system/user_offices.sql`. Повертає тільки **призначені** та **глобально активні** офіси для користувача.

```sql
CREATE VIEW mx_system.user_offices_user_view AS
SELECT
    u.id                AS user_id,
    o.id                AS office_id,
    o.title             AS office_title,
    o.city              AS office_city,
    o.address           AS office_address,
    o.phone             AS office_phone,
    o.email             AS office_email,
    uo.is_default       AS office_is_default  -- TRUE для одного запису на user_id
FROM mx_system.user_offices uo
JOIN public."user" u ON u.id = uo.user_id
JOIN mx_dic.offices o ON o.id = uo.office_id
WHERE o.is_active = TRUE
ORDER BY uo.is_default DESC, u.id, o.sort_order, o.id;
```

**Критична деталь:** `ORDER BY uo.is_default DESC` гарантує що дефолтний офіс іде першим — це використовується в `OfficeSwitcher` для ініціалізації стану через `offices.find(o => o.office_is_default) || offices[0]`.

### Таблиця: `mx_system.user_offices`

```sql
CREATE TABLE mx_system.user_offices (
    id         SERIAL PRIMARY KEY,
    user_id    text        NOT NULL,  -- FK → public."user"(id)
    office_id  int         NOT NULL,  -- FK → mx_dic.offices(id)
    is_default boolean     NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by text        NOT NULL,
    CONSTRAINT user_offices_user_office_unique UNIQUE (user_id, office_id)
);
```

### Тригер для `is_default`

В `sql/mx_system/user_offices_fn.sql` є тригери що гарантують:

- При INSERT першого офісу → `is_default = TRUE` автоматично
- При UPDATE `is_default = TRUE` → скидає `is_default` у всіх інших офісів цього user_id
- При DELETE офісу з `is_default = TRUE` → перший офіс що залишився стає default

**Це означає:** server action просто виконує `UPDATE ... SET is_default = TRUE` — решту робить тригер.

---

## 5. Структура файлів і їх роль

### 5.1 `interfaces/mx-system/user-offices.ts` (існуючий)

```typescript
export interface UserOfficeUserView {
  user_id: string;
  office_id: number;
  office_title: string; // головний текст в dropdown
  office_city: string | null; // підтекст (може бути відсутній)
  office_address: string | null;
  office_phone: string | null;
  office_email: string | null;
  office_is_default: boolean; // ← ключове поле для ініціалізації стану
}
```

### 5.2 `data/mx-system/user-offices.ts` — нова функція

**Функція:** `getUserOfficesUserViewByUserId(userId: string): Promise<UserOfficeUserView[]>`

```typescript
/**
 * Отримати призначені активні офіси для користувача.
 * Використовує VIEW: mx_system.user_offices_user_view
 *
 * @param userId - ідентифікатор користувача (Better Auth, тип text)
 * @returns Масив офісів, відсортований: дефолтний перший, далі за sort_order
 */
export async function getUserOfficesUserViewByUserId(
  userId: string
): Promise<UserOfficeUserView[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM mx_system.user_offices_user_view
      WHERE user_id = $1
      ORDER BY office_is_default DESC, office_id;
    `;
    const result = await client.query<UserOfficeUserView>(sql, [userId]);
    return result.rows;
  } catch (error) {
    console.error('[getUserOfficesUserViewByUserId] Помилка отримання офісів користувача:', error);
    throw new Error('Не вдалося отримати офіси користувача');
  } finally {
    client.release(); // ЗАВЖДИ повертати з'єднання в pool
  }
}
```

**Важливо:** `ORDER BY office_is_default DESC, office_id` в запиті дублює сортування View. Це явно документує намір і захищає від можливої зміни View у майбутньому.

### 5.3 `actions/profile/set-my-default-office.ts` — новий файл

**Server Action для КОРИСТУВАЧА** (не адміна). Відрізняється від `actions/mx-admin/user-data/set-default-user-office.ts` тим, що:

- Не приймає `userId` параметром — бере з сесії (безпека: користувач не може змінити офіс іншого)
- Не перевіряє `role === 'admin'`

```typescript
'use server';

/**
 * Server Action для зміни офісу за замовчуванням поточним авторизованим користувачем.
 * Не вимагає прав адміністратора. userId завжди береться з сесії.
 *
 * @param officeId - id офісу з mx_dic.offices (має бути призначений поточному user_id)
 * @returns ActionStatus з полями status та message
 */
export async function setMyDefaultOfficeAction(officeId: number): Promise<ActionStatus> {
  const user = await getCurrentUser();
  if (!user) return { status: 'error', message: '...', code: 'UNAUTHORIZED' };

  await updateUserOfficeDefault(user.id, officeId);
  // Тригер в БД автоматично скине is_default для інших офісів

  revalidatePath('/(protected)', 'layout');
  // Інвалідує кеш layout → при наступній навігації sidebar отримає оновлені дані

  return { status: 'success', message: 'Офіс за замовчуванням успішно змінено' };
}
```

**`revalidatePath('/(protected)', 'layout')`** — другий аргумент `'layout'` означає що інвалідується саме **layout** для цього route group, а не конкретна сторінка. Це оновить `AppSidebar` (і меню) при наступному переході.

### 5.4 `components/office-switcher.tsx` — новий файл

**Client Component**. Повна структура:

```typescript
'use client';

interface OfficeSwitcherProps {
  offices: UserOfficeUserView[];  // масив приходить із Server Component, не порожній
}

export const OfficeSwitcher = ({ offices }: OfficeSwitcherProps) => {
  // Ініціалізація: шукаємо дефолтний офіс, fallback на перший
  const defaultOffice = offices.find((o) => o.office_is_default) || offices[0];
  const [selectedOffice, setSelectedOffice] = useState(defaultOffice);
  const [, startTransition] = useTransition();
  //     ^-- isPending не використовується (немає індикатора завантаження),
  //         але startTransition потрібен для фонового виклику async action

  const handleSelectOffice = (office: UserOfficeUserView) => {
    if (office.office_id === selectedOffice.office_id) return;  // нічого не робити

    const previousOffice = selectedOffice;  // зберігаємо для відкату

    setSelectedOffice(office);              // оптимістичне оновлення
    startTransition(async () => {
      const result = await setMyDefaultOfficeAction(office.office_id);
      if (result.status === 'error') {
        setSelectedOffice(previousOffice);  // відкат
      }
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent ...">
              {/* Іконка Building2 замість Command (яка використовується для app logo) */}
              <div className="bg-sidebar-primary text-sidebar-primary-foreground ...">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{selectedOffice.office_title}</span>
                {selectedOffice.office_city && (
                  <span className="truncate text-xs">{selectedOffice.office_city}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"  {/* ширина = тригер */}
            align="start"
          >
            {offices.map((office) => (
              <DropdownMenuItem key={office.office_id} onSelect={() => handleSelectOffice(office)}>
                <div className="grid flex-1 leading-tight">
                  <span className="font-medium">{office.office_title}</span>
                  {office.office_city && (
                    <span className="text-muted-foreground text-xs">{office.office_city}</span>
                  )}
                </div>
                {office.office_id === selectedOffice.office_id && (
                  <Check className="ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

OfficeSwitcher.displayName = 'OfficeSwitcher';
```

**Ключові Tailwind класи:**

- `data-[state=open]:bg-sidebar-accent` — підсвітка кнопки коли dropdown відкритий
- `w-(--radix-dropdown-menu-trigger-width)` — CSS custom property від Radix, ширина dropdown = ширина тригера

### 5.5 `app/(protected)/layout.tsx` — зміни

```typescript
// Додано імпорт:
import { getUserOfficesUserViewByUserId } from '@/data/mx-system/user-offices';

// Додано до Promise.all:
const [userMenu, userPermissions, appSupportMenu, userOffices] = await Promise.all([
  buildUserMenu(user.id),
  getUserPermissions(user.id),
  getMenuAppSupport(),
  getUserOfficesUserViewByUserId(user.id),  // ← новий запит
]);

// Передача в компонент:
<AppSidebar user={user} appSupportMenu={activeAppSupport} userOffices={userOffices} />
```

**Чому `Promise.all`?** Всі 4 запити незалежні — виконуються паралельно. Загальний час = max(t1, t2, t3, t4), а не сума.

### 5.6 `components/app-sidebar.tsx` — зміни

```typescript
// Додані імпорти:
import { usePathname } from 'next/navigation';
import { OfficeSwitcher } from '@/components/office-switcher';
import type { UserOfficeUserView } from '@/interfaces/mx-system/user-offices';

// Розширений інтерфейс props:
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: ExtendedUser;
  appSupportMenu: Array<{ id: number; title: string; url: string; icon: string; }>;
  userOffices: UserOfficeUserView[];  // ← нове поле
}

// Всередині компонента:
const pathname = usePathname();
const isAdminRoute = pathname.startsWith('/mx-admin');

// Шапка сайдбара:
<SidebarHeader>
  {!isAdminRoute && userOffices.length > 0 ? (
    <OfficeSwitcher offices={userOffices} />
  ) : (
    // Статичний блок "MAXSA BURO" — без змін
  )}
</SidebarHeader>
```

---

## 6. Покрокова інтеграція в новий проєкт

### Передумови в БД

Модуль вимагає:

- `public."user"` — таблиця користувачів з полем `id: text`
- `mx_dic.offices` — таблиця офісів з полями: `id: int`, `title: text`, `city: text|null`, `sort_order: int`, `is_active: boolean`
- `mx_system.user_offices` — таблиця призначення офісів з полями: `user_id`, `office_id`, `is_default: boolean`
- View `mx_system.user_offices_user_view` (код у `sql/mx_system/user_offices.sql`)
- Тригери для `is_default` (код у `sql/mx_system/user_offices_fn.sql`)

### Крок 1: SQL

```bash
# Якщо таблиць і view ще немає:
psql -d your_db -f sql/mx_system/user_offices.sql
psql -d your_db -f sql/mx_system/user_offices_fn.sql
```

### Крок 2: TypeScript інтерфейс

Скопіювати `interfaces/mx-system/user-offices.ts`. Потрібен лише `UserOfficeUserView`.

### Крок 3: Data function

Додати `getUserOfficesUserViewByUserId` в `data/mx-system/user-offices.ts` (або аналогічний data-файл). Використовувати `pool` з `@/lib/db`.

### Крок 4: Server Action

Створити `actions/profile/set-my-default-office.ts`. Переконатись що:

- `getCurrentUser()` доступний та повертає об'єкт з `id`
- `updateUserOfficeDefault(userId, officeId)` існує в data-шарі
- `ActionStatus` інтерфейс доступний

### Крок 5: Компонент OfficeSwitcher

Скопіювати `components/office-switcher.tsx`. Перевірити що Shadcn UI компоненти (`DropdownMenu`, `SidebarMenu*`) встановлені.

### Крок 6: Layout

```typescript
// В server component layout:
import { getUserOfficesUserViewByUserId } from '@/data/mx-system/user-offices';

const userOffices = await getUserOfficesUserViewByUserId(user.id);
// або додати до існуючого Promise.all

<AppSidebar ... userOffices={userOffices} />
```

### Крок 7: AppSidebar

```typescript
// Додати prop:
interface AppSidebarProps ... {
  userOffices: UserOfficeUserView[];
}

// Розгорнути:
const { ..., userOffices } = props;
const pathname = usePathname();
const isAdminRoute = pathname.startsWith('/mx-admin');  // або /admin — залежить від проєкту

// Умовний рендер у <SidebarHeader>:
{!isAdminRoute && userOffices.length > 0 ? (
  <OfficeSwitcher offices={userOffices} />
) : (
  // статичний блок
)}
```

---

## 7. Псевдокод ключових алгоритмів

### Алгоритм визначення що показати в шапці

```
function SidebarHeader(isAdminRoute, userOffices):
  if NOT isAdminRoute AND userOffices.length >= 1:
    render OfficeSwitcher(offices=userOffices)
  else:
    render StaticAppBlock()
```

### Алгоритм перемикання офісу (OfficeSwitcher)

```
state selectedOffice = offices.find(is_default) OR offices[0]

function handleSelectOffice(newOffice):
  if newOffice.id == selectedOffice.id: return  // no-op

  prevOffice = selectedOffice
  selectedOffice = newOffice                    // оптимістично

  background_async:
    result = await setMyDefaultOfficeAction(newOffice.id)
    if result.status == 'error':
      selectedOffice = prevOffice               // відкат
    // якщо success — нічого додатково (revalidatePath зробив server action)
```

### Алгоритм server action (set-my-default-office)

```
function setMyDefaultOfficeAction(officeId):
  user = getCurrentUser()
  if NOT user: return error('UNAUTHORIZED')

  // DB UPDATE user_offices SET is_default=TRUE WHERE user_id=user.id AND office_id=officeId
  // Тригер в БД: скидає is_default для всіх інших офісів user.id
  updateUserOfficeDefault(user.id, officeId)

  revalidatePath('/(protected)', 'layout')
  // Next.js: layout ре-рендериться при наступній навігації
  // → buildUserMenu() перечитає nav_user_*_user_view (фільтр: is_default=TRUE)
  // → AppSidebar отримає оновлений userOffices

  return success()
```

---

## 8. Типові помилки та ловушки

### ❌ Передавати `userId` параметром у server action самозміни

```typescript
// Помилка: дозволяє змінити офіс ІНШОМУ користувачу
setMyDefaultOfficeAction(someUserId, officeId);

// Правильно: userId тільки з сесії
setMyDefaultOfficeAction(officeId); // userId береться всередині з getCurrentUser()
```

### ❌ Не зберігати `previousOffice` перед оптимістичним оновленням

```typescript
// Помилка: closure захопить ПОТОЧНЕ selectedOffice (вже змінене)
setSelectedOffice(office);
startTransition(async () => {
  if (error) setSelectedOffice(selectedOffice); // selectedOffice вже = office !
});

// Правильно:
const previousOffice = selectedOffice; // зберегти до зміни
setSelectedOffice(office);
startTransition(async () => {
  if (error) setSelectedOffice(previousOffice);
});
```

### ❌ Відсутність fallback при пошуку дефолтного офісу

```typescript
// Помилка: якщо жоден офіс не має is_default=true → undefined → runtime error
const defaultOffice = offices.find((o) => o.office_is_default);
const [selectedOffice] = useState(defaultOffice); // может бути undefined!

// Правильно:
const defaultOffice = offices.find((o) => o.office_is_default) || offices[0];
```

### ❌ Викликати компонент коли `offices` порожній

`OfficeSwitcher` розраховує що `offices.length >= 1`. Порожній масив → `offices[0]` = `undefined` → крах.

Логіка в AppSidebar правильно захищає: `userOffices.length > 0` перевіряється **до** рендерингу `<OfficeSwitcher>`.

### ❌ Використання `revalidatePath('/dashboard')` замість `'/(protected)', 'layout'`

`revalidatePath('/dashboard')` інвалідує тільки кеш сторінки `/dashboard`. Layout (`AppSidebar`) **не** оновиться — офіси у sidebar залишаться старими.

Правильно: `revalidatePath('/(protected)', 'layout')` — другий аргумент `'layout'` вказує що треба інвалідувати саме layout.

### ❌ `usePathname()` в Server Component

`usePathname` — хук, доступний тільки в Client Component. `AppSidebar` вже є `'use client'`, тому проблеми нема. Але якщо намагатись перевіряти маршрут у Server Component layout — треба передавати pathname як prop або використовувати `headers()`.

### ❌ Не використовувати `startTransition` для async server action

```typescript
// Помилка: без startTransition — блокується React rendering pipeline
const result = await setMyDefaultOfficeAction(office.office_id);

// Правильно:
startTransition(async () => {
  const result = await setMyDefaultOfficeAction(office.office_id);
});
```

### ❌ CSS клас ширини dropdown

```typescript
// Помилка: фіксована ширина не відповідає ширині тригера
className = 'w-48';

// Правильно: CSS custom property від Radix UI
className = 'w-(--radix-dropdown-menu-trigger-width)';
```

---

## 9. Залежності між модулями

```
PostgreSQL
  mx_system.user_offices (таблиця)
    └── is_default тригер (user_offices_fn.sql)
  mx_system.user_offices_user_view (view)
    └── фільтрує: is_active=TRUE, тільки assigned
         └── ORDER BY is_default DESC (дефолтний офіс перший)

data/mx-system/user-offices.ts
  getUserOfficesUserViewByUserId(userId)
    → читає user_offices_user_view
    → повертає UserOfficeUserView[]

  updateUserOfficeDefault(userId, officeId)
    → UPDATE user_offices SET is_default=TRUE
    → тригер скидає is_default для інших

actions/profile/set-my-default-office.ts
  setMyDefaultOfficeAction(officeId)
    → getCurrentUser()                 (auth-server.ts)
    → updateUserOfficeDefault()        (data layer)
    → revalidatePath('/(protected)', 'layout')  (Next.js cache)

app/(protected)/layout.tsx
  Promise.all([
    ...існуючі запити,
    getUserOfficesUserViewByUserId(user.id)  ← новий
  ])
  → <AppSidebar userOffices={userOffices} />

components/app-sidebar.tsx
  usePathname()           → визначає isAdminRoute
  props.userOffices       → масив офісів з layout
  → якщо !isAdminRoute && userOffices.length > 0:
      <OfficeSwitcher offices={userOffices} />
  → інакше:
      статичний блок "MAXSA BURO"

components/office-switcher.tsx
  useState(defaultOffice)           → локальний стан вибраного офісу
  useTransition()                   → фонове виконання action
  setMyDefaultOfficeAction()        → зміна is_default в БД
  → при success: revalidatePath оновить layout при наступній навігації
  → при error: відкат selectedOffice до попереднього значення

Побічний ефект (автоматично):
  Після зміни is_default в user_offices
    → nav_user_*_user_view JOIN user_offices WHERE is_default=TRUE
    → buildUserMenu() поверне меню для нового офісу
    → AppSidebar рендерить оновлене меню
```

---

## 10. Розширення модуля

### Показати індикатор завантаження під час перемикання

```typescript
const [isPending, startTransition] = useTransition();
// ...
<SidebarMenuButton disabled={isPending} className={isPending ? 'opacity-50' : ''}>
```

### Сповіщення про помилку (toast)

```typescript
import { toast } from 'sonner';
// в handleSelectOffice:
if (result.status === 'error') {
  setSelectedOffice(previousOffice);
  toast.error(result.message);
}
```

### Перехід на дефолтний маршрут нового офісу

```typescript
import { useRouter } from 'next/navigation';
const router = useRouter();
// після успішного action:
router.push('/dashboard'); // або специфічний маршрут офісу
```

### Заблокувати перемикання якщо тільки 1 офіс

```typescript
// В AppSidebar або в OfficeSwitcher:
if (offices.length === 1) {
  // Показати статичну кнопку без dropdown (без ChevronsUpDown)
  return <StaticOfficeBlock office={offices[0]} />;
}
```
