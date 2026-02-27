# Модулі Клієнтів та Виконавців

> **Версія**: 1.0.0
> **Дата**: 27 лютого 2026
> **Гілка**: `dev-20260225-assignee-page`

---

## Частина I: Модуль клієнтів (`/mx-job/clients`)

### I.1 Огляд

Модуль клієнтів реалізує повний CRUD-цикл для управління клієнтами офісу — від реєстрації нового клієнта до перегляду й редагування його профілю.

#### Ключові функції

| Функція                    | Опис                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| **Список клієнтів**        | Таблиця з fuzzy-пошуком, фільтром (всі / фізичні / юридичні особи), пагінацією |
| **Новий клієнт**           | Wizard (покрокова форма): ім'я → контакти → юридичні дані (опційно)            |
| **Профіль клієнта**        | Дві вкладки: перегляд (інформація + контакти) та редагування                   |
| **Призначення виконавців** | Checkbox-вибір клієнтів → `AssignAssigneeDialog`                               |

#### Концепція «клієнт без акаунту»

| Режим                     | Умова                 | Редагування                              |
| ------------------------- | --------------------- | ---------------------------------------- |
| Зареєстрований користувач | `user_id IS NOT NULL` | Лише сам користувач (через свій профіль) |
| Клієнт без акаунту        | `user_id IS NULL`     | Персонал офісу                           |

---

### I.2 Архітектура файлів

```
app/(protected)/mx-job/clients/
├── page.tsx                         # Список клієнтів (RSC + Suspense)
├── new/
│   └── page.tsx                     # Wizard нового клієнта
└── [clients_id]/
    └── page.tsx                     # Профіль клієнта (RSC)

components/mx-job/clients/
├── clients-table-wrapper.tsx        # async RSC — завантаження даних таблиці
├── clients-data-table.tsx           # 'use client' — TanStack Table
├── clients-columns.tsx              # 'use client' — визначення колонок
├── client-wizard.tsx                # 'use client' — wizard нового клієнта
├── client-tabs.tsx                  # 'use client' — card-based навігація вкладок
├── client-info-view.tsx             # RSC — вкладка "Інформація"
├── client-contacts-view.tsx         # async RSC — список контактів
└── client-edit-view.tsx             # 'use client' — вкладка "Редагування"

data/mx-data/clients.ts              # SQL-запити + мутації
actions/mx-job/clients/
├── create-client.ts                 # createClientAction (wizard)
└── update-client.ts                 # 4 actions для профілю клієнта

schemas/mx-job/client-schema.ts      # Zod-схеми
interfaces/mx-data/client-view.ts    # TypeScript-інтерфейси
sql/migrations/011_clients_nullable_user_id.sql  # Міграція
```

#### Патерн RSC всередині Client Component

`ClientTabs` є `'use client'`, але рендерить Server Components. Рішення — **props-патерн**: сторінка (RSC) готує контент і передає як `ReactNode`:

```tsx
// page.tsx (RSC) → ClientTabs ('use client') → infoContent: ReactNode
<ClientTabs
  infoContent={
    <div>
      <ClientInfoView client={client} />
      <Suspense fallback={<Skeleton />}>
        <ClientContactsView userDataId={clients_id} />
      </Suspense>
    </div>
  }
  editContent={
    <ClientEditView client={client} contactTypes={contactTypes} initialContacts={contacts} />
  }
/>
```

---

### I.3 База даних — міграція 011

Файл: `sql/migrations/011_clients_nullable_user_id.sql`

| Зміна                                   | Деталі                                                          |
| --------------------------------------- | --------------------------------------------------------------- |
| `user_data.user_id` → nullable          | NULL = клієнт без акаунту                                       |
| `user_contact` + колонка `user_data_id` | uuid FK → user_data(id) ON DELETE CASCADE                       |
| `user_contact.user_id` → nullable       | Дозволяє контакти без прив'язки до акаунту                      |
| CHECK `user_contact_owner_check`        | `user_id IS NOT NULL OR user_data_id IS NOT NULL`               |
| Унікальний індекс `is_default`          | `COALESCE(user_id, user_data_id::text)` WHERE is_default = TRUE |
| Оновлені тригери                        | Підтримка обох FK-шляхів                                        |
| FK `user_data_legal → user_data`        | ON DELETE CASCADE (новий)                                       |

#### Dual-FK контактна система

```
user_contact.user_id      → public.user(id)       [зареєстровані]
user_contact.user_data_id → mx_data.user_data(id)  [без акаунту]
```

Запит `getClientContacts` покриває обидва шляхи:

```sql
WHERE uc.user_data_id = $1
   OR (
     uc.user_id IS NOT NULL
     AND uc.user_id = (SELECT user_id FROM mx_data.user_data WHERE id = $1 AND user_id IS NOT NULL)
   )
```

#### Тригери `is_default` (після 011)

| Тригер                                  | Час    | Подія                  | Дія                                   |
| --------------------------------------- | ------ | ---------------------- | ------------------------------------- |
| `trg_user_contact_bu_maintain_default`  | BEFORE | UPDATE                 | Знімає `is_default` з інших контактів |
| `trg_user_contact_aid_maintain_default` | AFTER  | INSERT, DELETE         | Призначає/перепризначає `is_default`  |
| `trg_user_data_aud_has_contact`         | AFTER  | INSERT, UPDATE, DELETE | Мін. 1 контакт (DEFERRABLE)           |
| `trg_user_contact_aud_has_contact`      | AFTER  | INSERT, UPDATE, DELETE | Мін. 1 контакт (DEFERRABLE)           |

---

### I.4 TypeScript-інтерфейси та схеми

**`interfaces/mx-data/client-view.ts`**:

```typescript
export interface ClientView {
  user_data_id: string; // UUID — PK профілю
  user_id: string | null; // null = клієнт без акаунту
  user_name: string | null; // @username з public.user
  user_image: string | null;
  full_name: string;
  created_at: Date;
  updated_at: Date;
  contact_value: string | null; // Основний контакт (is_default)
  contact_type_code: string | null;
  contact_type_id: number | null;
  contact_url: string | null; // з fn_contact_build_url
  has_legal: boolean;
  is_assignee: boolean;
}
```

**`schemas/mx-job/client-schema.ts`**:

```typescript
// Ім'я: мін 2, макс 100, будь-який алфавіт
export const clientFullNameSchema = z.string().min(2).max(100).refine(...);

// Контакт у формі
export const clientContactItemSchema = z.object({
  contact_type_id: z.number().int().positive(),
  contact_type_code: z.string(),
  contact_type_title: z.string(),
  contact_value: z.string().min(1),
});

// Юридичні дані: ЄДРПОУ (8-10 цифр) + 16 опційних полів
export const clientLegalSchema = z.object({
  data_edrpou: z.string().min(8).max(10).regex(/^\d+$/),
  mfo_bank: z.string().max(6).optional().refine(v => !v || /^\d{6}$/.test(v)),
  // ...
});
```

---

### I.5 Функції шару даних (`data/mx-data/clients.ts`)

| Функція                                       | Опис                                 | Особливості                              |
| --------------------------------------------- | ------------------------------------ | ---------------------------------------- |
| `getClients(filter?)`                         | Список клієнтів з основним контактом | LATERAL JOIN, фільтр all/natural/legal   |
| `getClientById(userDataId)`                   | Один клієнт                          | Аналогічний запит + WHERE                |
| `getClientContacts(userDataId)`               | Всі контакти клієнта                 | Dual-FK SQL OR                           |
| `checkDuplicateContact(value, typeId)`        | Перевірка дублікату                  | По всій базі                             |
| `createClientWithContacts(data)`              | Атомарне створення                   | Транзакція: user_data + contacts + legal |
| `updateClientFullName(userDataId, name)`      | Оновити ім'я                         | `AND user_id IS NULL` (захист)           |
| `addClientContact(userDataId, typeId, value)` | Додати контакт                       | Транзакція, перший → is_default          |
| `setClientDefaultContact(userDataId, id)`     | Встановити основний                  | Тригер знімає з інших                    |
| `deleteClientContact(userDataId, id)`         | Видалити контакт                     | Захист мін. 1 контакту                   |
| `getClientLegal(userDataId)`                  | Юридичні дані                        | Простий SELECT                           |

---

### I.6 Server Actions (`actions/mx-job/clients/update-client.ts`)

Всі actions: **auth check → validate → DB call → revalidatePath → ActionStatus**.

```typescript
'use server'

updateClientFullNameAction(userDataId: string, fullName: string): Promise<ActionStatus>
addClientContactAction(userDataId, contactTypeId, contactTypeCode, contactValue): Promise<ActionStatus>
setClientDefaultContactAction(userDataId: string, contactId: string): Promise<ActionStatus>
deleteClientContactAction(userDataId: string, contactId: string): Promise<ActionStatus>
```

---

### I.7 Компоненти — короткий опис

**`clients-table-wrapper.tsx`** (async RSC):

- `Promise.all([getClients(), getUserPermissions(), getUserOfficesUserViewByUserId()])`
- Визначає `hasAssignPermission` (permission_id === 2) та `defaultOffice`

**`clients-data-table.tsx`** ('use client'):

- TanStack Table v8 з fuzzy filter (`rankItem`)
- `ToggleGroup` для `ClientFilter` — клієнтська фільтрація
- `enableRowSelection: (row) => !row.original.is_assignee`
- Після призначення: `setRowSelection({})` + `window.open()`
- ⚠️ React Compiler не мемоізує (TanStack Table v8 несумісний)

**`client-tabs.tsx`** ('use client'):

- Card-based навігація (не Radix Tabs)
- Props: `infoContent: ReactNode`, `editContent: ReactNode`

**`client-info-view.tsx`** (RSC):

- Avatar + ProfileInfoRow для ім'я, контакт, дати
- 3 статус-картки: Користувач (зелений якщо user_id IS NOT NULL), Співробітник (заглушка), Виконавець (заглушка)

**`client-contacts-view.tsx`** (async RSC):

- `getClientContacts(userDataId)` → `ProfileSection` зі списком `Item`
- Heart icon для `is_default`

**`client-edit-view.tsx`** ('use client'):

- `user_id !== null` → `Empty` + `ShieldAlert` (редагування заборонено)
- `user_id === null` → EditDbMaxsa для імені + inline-форма контактів + AlertDialog для видалення
- Оптимістичний локальний стан `contacts`

---

### I.8 Відомі обмеження

| Проблема                                          | Рішення                                                |
| ------------------------------------------------- | ------------------------------------------------------ |
| TanStack Table v8 + React Compiler                | ESLint suppress коментар, функціональність не порушена |
| `AddContactForm` не придатна для перевикористання | Власна inline-форма в `ClientEditView`                 |
| `params` — `Promise` в Next.js 16                 | `const { clients_id } = await params`                  |
| Оптимістичні оновлення — обмежений scope          | При reload дані беруться з RSC (свіжі)                 |

---

---

## Зміст

1. [Overview](#1-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Architecture](#3-architecture)
4. [Public Interfaces / Contracts](#4-public-interfaces--contracts)
5. [Database](#5-database)
6. [File-by-file Breakdown](#6-file-by-file-breakdown)
7. [Algorithms & Validation Rules](#7-algorithms--validation-rules)
8. [Integration Guide (Clean Next.js Project)](#8-integration-guide-clean-nextjs-project)
9. [Testing](#9-testing)
10. [Pitfalls & Gotchas](#10-pitfalls--gotchas)

---

## 1. Overview

### Формулювання проблеми

У системі є клієнти (`mx_data.user_data`), які замовляють послуги. Частина цих клієнтів може виступати **виконавцями** — особами, що безпосередньо виконують послуги (перекладач, нотаріус, кур'єр тощо). Раніше не існувало механізму для позначення особи як виконавця та прив'язки її до офісів.

### Бізнес-мета

Менеджер зі спеціальним правом доступу (permission_id = 2) може призначити одного або кількох клієнтів виконавцями прямо зі сторінки списку клієнтів. Після призначення для кожного виконавця автоматично відкривається персональна сторінка в новій вкладці браузера.

### Scope

**✅ Реалізовано:**

- Таблиця `mx_data.assignee_data` — запис виконавця (1 особа = 1 виконавець)
- Таблиця `mx_data.assignee_offices` — M:M зв'язок виконавець ↔ офіс
- Довідник `mx_dic.dic_posts_assignee` — посади виконавців (Кандидат, Перекладач, Нотаріус, Кур'єр)
- View `mx_data.assignee_data_view` — повний перегляд виконавця з контактом
- Server Action `createAssigneeAction` — призначення одного або кількох виконавців
- UI: checkbox-колонка в таблиці клієнтів (видима лише з permission_id = 2)
- UI: кнопка «Призначити виконавцями» з діалогом підтвердження
- Поле `is_assignee: boolean` в запитах `getClients()` та `getClientById()`
- Персональна сторінка виконавця `/mx-job/assignee/[assignee_id]` (мінімальна версія)
- Міграція `012_assignee_data_fix_and_offices.sql` для живої БД

**❌ Свідомо не реалізовано:**

- Повний функціонал персональної сторінки виконавця (позначено TODO)
- Можливість зняти статус виконавця (видалення з `assignee_data`)
- Редагування посади виконавця та опису
- UI для управління прив'язкою виконавця до офісів
- Toast-повідомлення про помилку в діалозі (позначено TODO)

### Definition of Done

- [x] Користувач з permission_id = 2 бачить checkbox-колонку в таблиці клієнтів
- [x] Вибір рядків доступний лише для осіб, що ще не є виконавцями
- [x] Кнопка «Призначити виконавцями» активується при наявності вибраних рядків
- [x] Діалог показує ім'я особи (одиничне) або список імен (множинне)
- [x] Діалог показує офіс за замовчуванням, до якого буде прив'язано виконавця
- [x] Після підтвердження: призначення атомарно зберігається в БД, сторінка клієнтів ревалідується, відкриваються нові вкладки
- [x] Сервер перевіряє автентифікацію та permission_id = 2 незалежно від клієнта
- [x] При спробі призначити вже-виконавця — повертається `status: 'warning'`
- [x] `/mx-job/assignee/[assignee_id]` — відображає ім'я та посаду; `notFound()` якщо не існує

---

## 2. Tech Stack & Dependencies

| Library / API                  | Version  | Purpose                                      | Why chosen                                            |
| ------------------------------ | -------- | -------------------------------------------- | ----------------------------------------------------- |
| `next`                         | ^16.1.6  | App Router, Server Actions, `revalidatePath` | Основний фреймворк проекту                            |
| `react`                        | ^19.2.4  | UI, `useTransition` для async actions        | Основний UI фреймворк                                 |
| `@tanstack/react-table`        | ^8.21.3  | Таблиця клієнтів з row selection             | Вже використовується в проекті                        |
| `@tanstack/match-sorter-utils` | ^8.19.4  | Fuzzy-пошук в таблиці                        | Вже використовується в проекті                        |
| `@radix-ui/react-checkbox`     | ^1.3.3   | Checkbox компонент для вибору рядків         | Через ShadcnUI CLI (`npx shadcn@latest add checkbox`) |
| `@radix-ui/react-alert-dialog` | ^1.1.15  | Діалог підтвердження                         | Вже в проекті як `components/ui/alert-dialog`         |
| `@radix-ui/react-separator`    | ^1.1.8   | Роздільник в діалозі                         | Вже в проекті                                         |
| `pg`                           | ^8.18.0  | PostgreSQL connection pool                   | Прямий SQL без ORM — конвенція проекту                |
| `zustand`                      | ^5.0.11  | `useUserPermissionsStore` для прав           | Конвенція проекту для глобального стану               |
| `lucide-react`                 | ^0.574.0 | Іконки (`UserCheck`, `Users`, тощо)          | Конвенція проекту                                     |
| `better-auth`                  | ^1.4.17  | `getCurrentUser()` — серверна сесія          | Конвенція проекту                                     |

---

## 3. Architecture

### High-level діаграма

```
[app/(protected)/mx-job/clients/page.tsx]
         │ renders
         ▼
[components/mx-job/clients/clients-table-wrapper.tsx]  ← Server Component
         │ Promise.all([getClients(), getUserPermissions(), getUserOfficesUserViewByUserId()])
         │ checks permission_id === 2, finds defaultOffice
         ▼
[components/mx-job/clients/clients-data-table.tsx]     ← Client Component
         │ useReactTable({ enableRowSelection: row => !row.original.is_assignee })
         │ getClientsColumns(hasAssignPermission)
         ▼
[components/mx-job/clients/clients-columns.tsx]        ← Client Component
         │ checkbox column (disabled if is_assignee)
         ▼
[components/mx-job/assignee/assign-assignee-dialog.tsx] ← Client Component
         │ useTransition → createAssigneeAction(userDataIds, defaultOfficeId)
         ▼
[actions/mx-job/assignee/create-assignee.ts]           ← Server Action ('use server')
         │ getCurrentUser() → getUserPermissions() → checkIsAssignee() → createAssignee()
         ▼
[data/mx-data/assignee.ts → createAssignee()]
         │ BEGIN transaction
         │ SELECT user_id FROM mx_data.user_data
         │ INSERT mx_data.assignee_data
         │ INSERT mx_data.assignee_offices (is_default=TRUE)
         │ COMMIT
         ▼
[PostgreSQL: mx_data.assignee_data, mx_data.assignee_offices]

[app/(protected)/mx-job/assignee/[assignee_id]/page.tsx] ← Server Component
         │ getAssigneeById(assignee_id)
         ▼
[data/mx-data/assignee.ts → getAssigneeById()]
         │ SELECT * FROM mx_data.assignee_data_view WHERE assignee_id = $1
         ▼
[PostgreSQL: mx_data.assignee_data_view]
```

### Data Flow — призначення виконавця

| Крок                       | Де                                    | Що відбувається                                                                 |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| 1. Завантаження сторінки   | `clients-table-wrapper.tsx` (сервер)  | `Promise.all` — завантажуються клієнти, права, офіси; `is_assignee` вже в даних |
| 2. Рендер таблиці          | `clients-data-table.tsx` (клієнт)     | TanStack Table, `enableRowSelection` блокує вибір вже-виконавців                |
| 3. Вибір рядків            | браузер                               | Checkbox-колонка доступна лише якщо `hasAssignPermission=true`                  |
| 4. Кнопка «Призначити»     | `clients-data-table.tsx` (клієнт)     | Активна лише коли `selectedClients.length > 0`                                  |
| 5. Відкриття діалогу       | `assign-assignee-dialog.tsx` (клієнт) | Показує список імен та офіс                                                     |
| 6. Підтвердження           | `assign-assignee-dialog.tsx` (клієнт) | `useTransition` → `createAssigneeAction()`                                      |
| 7. Auth + Permission check | `create-assignee.ts` (сервер)         | `getCurrentUser()` + `getUserPermissions()` + перевірка `permission_id === 2`   |
| 8. UUID validation         | `create-assignee.ts` (сервер)         | Regex перевірка кожного `userDataId`                                            |
| 9. Перевірка дублікатів    | `create-assignee.ts` (сервер)         | `checkIsAssignee()` для кожного ID                                              |
| 10. Транзакція в БД        | `data/mx-data/assignee.ts` (сервер)   | `BEGIN` → INSERT assignee_data → INSERT assignee_offices → `COMMIT`             |
| 11. Ревалідація            | `create-assignee.ts` (сервер)         | `revalidatePath('/mx-job/clients')`                                             |
| 12. Post-success           | `clients-data-table.tsx` (клієнт)     | `setRowSelection({})` + `window.open()` для кожного `assignee_id`               |

### Server vs Client

| Компонент / Функція                                      | Сервер / Клієнт            | Причина                                                 |
| -------------------------------------------------------- | -------------------------- | ------------------------------------------------------- |
| `clients-table-wrapper.tsx`                              | **Сервер**                 | Завантаження даних, перевірка прав без витоку на клієнт |
| `clients-data-table.tsx`                                 | **Клієнт**                 | Інтерактивність: стан вибору рядків, dialog open/close  |
| `clients-columns.tsx`                                    | **Клієнт**                 | `ColumnDef` для TanStack Table (функція, не компонент)  |
| `assign-assignee-dialog.tsx`                             | **Клієнт**                 | `useTransition` для виклику Server Action               |
| `create-assignee.ts`                                     | **Сервер** (Server Action) | Мутація БД, перевірка сесії та прав                     |
| `data/mx-data/assignee.ts`                               | **Сервер**                 | Прямий SQL через `pg` pool                              |
| `app/(protected)/mx-job/assignee/[assignee_id]/page.tsx` | **Сервер**                 | SSR сторінки виконавця                                  |

### Ключові архітектурні рішення

> **Рішення**: Перевірка `hasAssignPermission` на сервері в `ClientsTableWrapper`, а не на клієнті
> **Причина**: Запобігає витоку даних про права через JS bundle; UI адаптується без додаткових клієнтських запитів

> **Рішення**: M:M таблиця `assignee_offices` замість колонки `office_id` в `assignee_data`
> **Причина**: Виконавець може працювати в кількох офісах; відсутність записів = доступний для всіх офісів

> **Рішення**: `UNIQUE(user_data_id)` в `assignee_data` (1 особа = 1 виконавець)
> **Причина**: Запобігає дублюванню; особа може мати лише одну роль виконавця незалежно від посади

> **Рішення**: `enableRowSelection: (row) => !row.original.is_assignee`
> **Причина**: Виконавців не можна перепризначити; checkbox залишається видимим але disabled для прозорості

> **Рішення**: `post_assignee_id = 1` (Кандидат) як значення за замовчуванням при призначенні
> **Причина**: Менеджер призначає початковий статус; редагування посади — майбутній функціонал персональної сторінки

---

## 4. Public Interfaces / Contracts

### 4.1 HTTP Routes

🔴 Not applicable in this task — модуль не використовує HTTP routes, лише Server Actions та RSC.

### 4.2 Server Actions

```typescript
// Файл: actions/mx-job/assignee/create-assignee.ts
// 'use server'

async function createAssigneeAction(
  userDataIds: string[], // масив UUID з mx_data.user_data.id
  defaultOfficeId: number // ID офісу з mx_dic.offices.id
): Promise<ActionStatus | CreateAssigneeSuccessStatus>;

// Side effects:
//   - INSERT в mx_data.assignee_data (по одному запису на кожен userDataId)
//   - INSERT в mx_data.assignee_offices (is_default=TRUE, office_id=defaultOfficeId)
//   - revalidatePath('/mx-job/clients')
//
// Returns:
//   - { status: 'success', message: string, assignee_ids: string[] } — успіх
//   - { status: 'error', message: string, code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'DB_ERROR' | 'UNKNOWN_ERROR' }
//   - { status: 'warning', message: string, code: 'ALREADY_ASSIGNEE' }
//
// Throws: не кидає — всі помилки повертаються як ActionStatus
```

### 4.3 Shared Types / Interfaces

```typescript
// Файл: interfaces/mx-data/assignee.ts
export interface AssigneeView {
  assignee_id: string; // UUID з mx_data.assignee_data.id
  user_data_id: string; // UUID з mx_data.user_data.id
  user_id: string | null; // text з public."user".id (NULL якщо без акаунту)
  full_name: string;
  post_assignee_id: number;
  post_assignee_title: string; // назва з mx_dic.dic_posts_assignee
  description: string | null;
  updated_by: string | null; // text (user.id) хто останній редагував
  created_at: Date;
  updated_at: Date;
  contact_value: string | null; // основний контакт (default або найновіший)
  contact_type_code: string | null;
  contact_type_id: number | null;
  contact_url: string | null; // побудована URL через fn_contact_build_url
  user_name: string | null; // name з public."user" (якщо є акаунт)
  user_image: string | null;
  is_banned: boolean | null;
}

// Файл: interfaces/mx-data/client-view.ts (доповнено)
export interface ClientView {
  user_data_id: string;
  // ... (інші поля без змін)
  is_assignee: boolean; // ← ДОДАНЕ ПОЛЕ: чи є особа виконавцем
}

// Файл: actions/mx-job/assignee/create-assignee.ts
export interface CreateAssigneeSuccessStatus {
  status: 'success';
  message: string;
  assignee_ids: string[]; // UUID нових записів assignee_data.id
}

// Файл: interfaces/action-status.ts (без змін, довідково)
export type ActionStatus =
  | SuccessActionStatus // { status: 'success', message: string, code?: string }
  | ErrorActionStatus // { status: 'error', message: string, code?: string }
  | WarningActionStatus // { status: 'warning', message: string }
  | InfoActionStatus // { status: 'info', message: string }
  | TwoFactorActionStatus;
```

### 4.4 Events / Background Jobs

🔴 Not applicable in this task — немає фонових завдань або подій.

---

## 5. Database

### 5.1 Full DDL

```sql
-- ============================================================
-- Довідник посад виконавців
-- ============================================================
CREATE TABLE IF NOT EXISTS mx_dic.dic_posts_assignee
(
    id    SMALLSERIAL PRIMARY KEY,
    title VARCHAR(20) NOT NULL
);

-- Seed-дані (посади)
INSERT INTO mx_dic.dic_posts_assignee (title)
SELECT v.title
FROM (VALUES ('Кандидат'), ('Перекладач'), ('Нотаріус'), ('Курʼєр')) AS v(title)
WHERE NOT EXISTS (SELECT 1 FROM mx_dic.dic_posts_assignee);

-- ============================================================
-- Таблиця виконавців
-- ============================================================
CREATE TABLE mx_data.assignee_data
(
    id               uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_data_id     uuid         NOT NULL,   -- особа → mx_data.user_data (CASCADE)
    user_id          text         NULL,       -- акаунт → public."user" (SET NULL при видаленні)
    post_assignee_id INTEGER      NOT NULL,   -- посада → mx_dic.dic_posts_assignee (RESTRICT)
    description      TEXT         NULL,       -- довільний опис
    updated_by       text         NULL,       -- хто змінив → public."user" (SET NULL)
    created_at       timestamptz  NOT NULL DEFAULT now(),
    updated_at       timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT assignee_data_fk_user_data
        FOREIGN KEY (user_data_id) REFERENCES mx_data.user_data (id) ON DELETE CASCADE,
    CONSTRAINT assignee_data_fk_user
        FOREIGN KEY (user_id) REFERENCES public."user" (id) ON DELETE SET NULL,
    CONSTRAINT assignee_data_fk_updated_by
        FOREIGN KEY (updated_by) REFERENCES public."user" (id) ON DELETE SET NULL,
    CONSTRAINT assignee_data_fk_post_assignee
        FOREIGN KEY (post_assignee_id) REFERENCES mx_dic.dic_posts_assignee (id) ON DELETE RESTRICT,
    CONSTRAINT assignee_data_unique_user_data_id
        UNIQUE (user_data_id)                -- 1 особа = 1 виконавець
);

CREATE INDEX IF NOT EXISTS assignee_data_user_data_id_idx ON mx_data.assignee_data (user_data_id);
CREATE INDEX IF NOT EXISTS assignee_data_user_id_idx      ON mx_data.assignee_data (user_id);
CREATE INDEX IF NOT EXISTS assignee_data_post_idx         ON mx_data.assignee_data (post_assignee_id);

-- ============================================================
-- M:M зв'язок виконавець ↔ офіс
-- Відсутність записів = доступний для всіх офісів
-- ============================================================
CREATE TABLE mx_data.assignee_offices
(
    id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignee_data_id uuid        NOT NULL,   -- → mx_data.assignee_data (CASCADE)
    office_id        int         NOT NULL,   -- → mx_dic.offices (CASCADE)
    is_default       boolean     NOT NULL DEFAULT FALSE,
    created_at       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT assignee_offices_fk_assignee
        FOREIGN KEY (assignee_data_id) REFERENCES mx_data.assignee_data (id) ON DELETE CASCADE,
    CONSTRAINT assignee_offices_fk_office
        FOREIGN KEY (office_id) REFERENCES mx_dic.offices (id) ON DELETE CASCADE,
    CONSTRAINT assignee_offices_unique
        UNIQUE (assignee_data_id, office_id)
);

CREATE INDEX IF NOT EXISTS assignee_offices_assignee_idx ON mx_data.assignee_offices (assignee_data_id);
CREATE INDEX IF NOT EXISTS assignee_offices_office_idx   ON mx_data.assignee_offices (office_id);

-- ============================================================
-- View: повний перегляд виконавця
-- ============================================================
CREATE VIEW mx_data.assignee_data_view AS
SELECT
    ad.id                                                                   AS assignee_id,
    ad.user_data_id,
    ad.user_id,
    ud.full_name,
    ad.post_assignee_id,
    dp.title                                                                AS post_assignee_title,
    ad.description,
    ad.updated_by,
    ad.created_at,
    ad.updated_at,
    uc.contact_value,
    dct.code                                                                AS contact_type_code,
    uc.contact_type_id,
    mx_data.fn_contact_build_url(dct.code, uc.contact_value)               AS contact_url,
    u.name                                                                  AS user_name,
    u.image                                                                 AS user_image,
    u."isBanned"                                                            AS is_banned
FROM mx_data.assignee_data ad
    JOIN mx_data.user_data ud ON ud.id = ad.user_data_id
    JOIN mx_dic.dic_posts_assignee dp ON dp.id = ad.post_assignee_id
    LEFT JOIN LATERAL (
        SELECT c.contact_value, c.contact_type_id
        FROM mx_data.user_contact c
        WHERE (ad.user_id IS NOT NULL AND c.user_id = ad.user_id)
           OR (ad.user_id IS NULL AND c.user_data_id = ad.user_data_id)
        ORDER BY c.is_default DESC, c.updated_at DESC
        LIMIT 1
    ) uc ON TRUE
    LEFT JOIN mx_dic.dic_contact_type dct ON dct.id = uc.contact_type_id
    LEFT JOIN public."user" u ON u.id = ad.user_id;
```

**Поле `is_assignee` у запитах (computed, не в таблиці):**

```sql
-- Додано до getClients() та getClientById() у data/mx-data/clients.ts
EXISTS (
  SELECT 1 FROM mx_data.assignee_data ad WHERE ad.user_data_id = ud.id
) AS is_assignee
```

### 5.2 Migrations

| Filename                                               | Order | What it does                                                                                      |
| ------------------------------------------------------ | ----- | ------------------------------------------------------------------------------------------------- |
| `sql/migrations/012_assignee_data_fix_and_offices.sql` | 12    | Виправляє `assignee_data` (broken FK, UNIQUE, updated_by), додає `assignee_offices`, оновлює VIEW |

**Команда для запуску на живій БД:**

```bash
psql -U your_user -d your_database -f sql/migrations/012_assignee_data_fix_and_offices.sql
```

**Команда для відтворення з нуля:**

```bash
psql -U your_user -d your_database -f sql/migrations/clear_database_create_db_for_new_app.sql
```

### 5.3 Data Integrity Rules

| Правило                                   | Реалізація                                                | Бізнес-причина                                            |
| ----------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| 1 особа = 1 виконавець                    | `UNIQUE(user_data_id)` в `assignee_data`                  | Особа не може мати два записи виконавця                   |
| Видалення особи → видалення виконавця     | `ON DELETE CASCADE` (user_data → assignee_data)           | Якщо профіль видалено, виконавець автоматично видаляється |
| Видалення акаунту → збереження виконавця  | `ON DELETE SET NULL` (user → assignee_data.user_id)       | Виконавець без акаунту може продовжувати роботу           |
| Посаду не можна видалити якщо є виконавці | `ON DELETE RESTRICT` (dic_posts_assignee → assignee_data) | Цілісність довідника                                      |
| Видалення виконавця → видалення офісів    | `ON DELETE CASCADE` (assignee_data → assignee_offices)    | Очищення зв'язків при видаленні                           |
| Унікальність пари виконавець+офіс         | `UNIQUE(assignee_data_id, office_id)`                     | Не можна додати офіс двічі                                |

### 5.4 Computed Fields / Formulas

**`is_assignee` в `ClientView`:**

```
EXISTS (
  SELECT 1 FROM mx_data.assignee_data ad
  WHERE ad.user_data_id = ud.id
)
```

Обчислюється в запитах `getClients()` та `getClientById()` — не зберігається.

**`contact_url` в `AssigneeView`:**

```
mx_data.fn_contact_build_url(contact_type_code, contact_value)
```

PostgreSQL-функція, яка будує клікабельну URL за типом контакту (tel:, mailto:, https://t.me/, тощо).

**Основний контакт виконавця (LATERAL JOIN):**

```
1. Якщо user_id IS NOT NULL → шукати в user_contact за user_id
2. Якщо user_id IS NULL → шукати в user_contact за user_data_id
3. Сортування: is_default DESC, updated_at DESC
4. Взяти тільки 1 запис (LIMIT 1)
```

### 5.5 Edge Cases

- **NULL `user_id`**: виконавець може не мати акаунту в системі. `user_id=NULL` — нормальний стан.
- **Відсутність офісів в `assignee_offices`**: означає «виконавець для всіх офісів» — не помилка.
- **Timezone**: всі `timestamptz` зберігаються в UTC.
- **Concurrency**: якщо два менеджери одночасно призначають одну особу — другий отримає помилку від `UNIQUE(user_data_id)`. Server Action обробляє це через `try/catch` і повертає `status: 'error'`. Перевірка `checkIsAssignee()` до INSERT — не атомарна, але UNIQUE constraint є останнім захистом.

---

## 6. File-by-file Breakdown

```
📄 interfaces/mx-data/assignee.ts
  Відповідальність: TypeScript-тип для рядка mx_data.assignee_data_view
  Ключові exports: AssigneeView (interface)
  Залежить від: нічого
  Імпортується в: data/mx-data/assignee.ts, app/(protected)/mx-job/assignee/[assignee_id]/page.tsx

📄 interfaces/mx-data/client-view.ts
  Відповідальність: TypeScript-тип для ClientView (доповнено полем is_assignee)
  Ключові exports: ClientView (interface), ClientLegal, DuplicateContactResult
  Зміна: додано поле is_assignee: boolean
  Залежить від: нічого
  Імпортується в: data/mx-data/clients.ts, components/mx-job/clients/*

📄 data/mx-data/assignee.ts
  Відповідальність: SQL-запити до assignee_data та assignee_data_view
  Ключові exports:
    getAssignees(): Promise<AssigneeView[]>
    getAssigneeById(assigneeId: string): Promise<AssigneeView | null>
    checkIsAssignee(userDataId: string): Promise<boolean>
    createAssignee(userDataId, postAssigneeId, createdBy, defaultOfficeId): Promise<{ assignee_id: string }>
  Важлива логіка:
    createAssignee — атомарна транзакція: BEGIN → SELECT user_id → INSERT assignee_data → INSERT assignee_offices → COMMIT
  Залежить від: lib/db.ts (pool), interfaces/mx-data/assignee.ts
  Імпортується в: actions/mx-job/assignee/create-assignee.ts, app/...assignee/[assignee_id]/page.tsx

📄 data/mx-data/clients.ts
  Відповідальність: SQL-запити до user_data (список клієнтів)
  Зміна: додано підзапит `EXISTS (SELECT 1 FROM assignee_data ...)  AS is_assignee` до getClients() та getClientById()
  Залежить від: lib/db.ts, interfaces/mx-data/client-view.ts

📄 actions/mx-job/assignee/create-assignee.ts
  Відповідальність: Server Action для призначення виконавців
  Ключові exports: createAssigneeAction, CreateAssigneeSuccessStatus (interface)
  Важлива логіка:
    1. Перевірка авторизації через getCurrentUser()
    2. Перевірка permission_id === 2 через getUserPermissions()
    3. UUID regex validation для кожного userDataId
    4. checkIsAssignee() для кожного ID (попереджує дублікати)
    5. createAssignee() для кожного ID з post_assignee_id=1 (Кандидат за замовчуванням)
    6. revalidatePath('/mx-job/clients')
  Залежить від: data/mx-data/assignee.ts, lib/auth/auth-server.ts, lib/permissions/get-user-permissions.ts
  Імпортується в: components/mx-job/assignee/assign-assignee-dialog.tsx

📄 components/mx-job/clients/clients-table-wrapper.tsx
  Відповідальність: Server Component — завантаження даних, перевірка прав, передача в таблицю
  Ключові exports: ClientsTableWrapper (named)
  Важлива логіка:
    Promise.all([getClients(), getUserPermissions(), getUserOfficesUserViewByUserId()])
    Визначення defaultOffice: offices.find(o => o.office_is_default) ?? offices[0] ?? null
  Залежить від: data/mx-data/clients.ts, data/mx-system/user-offices.ts, lib/auth/auth-server.ts, lib/permissions/get-user-permissions.ts
  Імпортується в: app/(protected)/mx-job/clients/page.tsx

📄 components/mx-job/clients/clients-columns.tsx
  Відповідальність: Визначення колонок TanStack Table для таблиці клієнтів
  Зміна: перетворено з const array на функцію; додано умовну checkbox-колонку
  Ключові exports: getClientsColumns(hasAssignPermission: boolean): ColumnDef<ClientView>[]
  Важлива логіка:
    Якщо hasAssignPermission=true — checkbox column йде першою
    disabled={isAssignee} — виконавці не можна вибрати
    e.stopPropagation() — клік на checkbox не відкриває картку клієнта
  Залежить від: components/ui/checkbox, @tanstack/react-table
  Імпортується в: components/mx-job/clients/clients-data-table.tsx

📄 components/mx-job/clients/clients-data-table.tsx
  Відповідальність: Client Component — інтерактивна таблиця з вибором рядків та діалогом
  Ключові exports: ClientsDataTable (named)
  Важлива логіка:
    RowSelectionState + enableRowSelection: (row) => !row.original.is_assignee
    handleAssignSuccess: setRowSelection({}) + window.open() для кожного assignee_id
    AssignAssigneeDialog рендериться умовно (лише якщо hasAssignPermission)
  Залежить від: @tanstack/react-table, components/mx-job/assignee/assign-assignee-dialog.tsx, clients-columns.tsx
  Імпортується в: components/mx-job/clients/clients-table-wrapper.tsx

📄 components/mx-job/assignee/assign-assignee-dialog.tsx
  Відповідальність: Client Component — AlertDialog підтвердження призначення
  Ключові exports: AssignAssigneeDialog (named)
  Важлива логіка:
    useTransition для async виклику Server Action
    При помилці — діалог залишається відкритим (TODO: показати toast)
    Кнопка disabled якщо !defaultOfficeId або isPending
  Залежить від: actions/mx-job/assignee/create-assignee.ts, components/ui/alert-dialog

📄 app/(protected)/mx-job/assignee/[assignee_id]/page.tsx
  Відповідальність: Server Component — персональна сторінка виконавця (мінімальна версія)
  Ключові exports: Page (default export)
  Важлива логіка: notFound() якщо getAssigneeById() повертає null
  Залежить від: data/mx-data/assignee.ts
  TODO: повний функціонал персональної сторінки

📄 sql/mx-data/assignee-data.sql
  Відповідальність: Канонічний файл структури таблиць assignee_data, assignee_offices та view
  Порядок: DROP VIEW → DROP TABLE → CREATE TABLE → indexes → CREATE VIEW

📄 sql/migrations/012_assignee_data_fix_and_offices.sql
  Відповідальність: Міграція для живої БД — виправлення broken FK, UNIQUE, додавання таблиць
  Обгорнуто в BEGIN/COMMIT транзакцію
  Всі ALTER/ADD обгорнуті в DO $$ IF NOT EXISTS $$ для ідемпотентності
```

---

## 7. Algorithms & Validation Rules

### 7.1 Key Algorithms

**Server Action `createAssigneeAction`:**

```
function createAssigneeAction(userDataIds, defaultOfficeId):
  1. getCurrentUser() → якщо null → { status: 'error', code: 'UNAUTHORIZED' }
  2. getUserPermissions(user.id) → якщо немає permission_id=2 → { status: 'error', code: 'FORBIDDEN' }
  3. якщо userDataIds порожній → { status: 'error', code: 'VALIDATION_ERROR' }
  4. якщо defaultOfficeId <= 0 → { status: 'error', code: 'VALIDATION_ERROR' }
  5. для кожного id: regex UUID → якщо невалідний → { status: 'error', code: 'VALIDATION_ERROR' }
  6. для кожного id: checkIsAssignee(id) → якщо true → { status: 'warning', code: 'ALREADY_ASSIGNEE' }
  7. для кожного id: createAssignee(id, postAssigneeId=1, user.id, defaultOfficeId) → push assignee_id
  8. revalidatePath('/mx-job/clients')
  9. return { status: 'success', message, assignee_ids }
```

**Data function `createAssignee` (транзакція):**

```
function createAssignee(userDataId, postAssigneeId, createdBy, defaultOfficeId):
  1. pool.connect() → client
  2. BEGIN
  3. SELECT user_id FROM mx_data.user_data WHERE id = userDataId
     → якщо null рядок → throw Error('Запис персональних даних не знайдено')
  4. INSERT INTO mx_data.assignee_data (user_data_id, user_id, post_assignee_id, updated_by)
     VALUES (userDataId, userId, postAssigneeId, createdBy)
     RETURNING id → assigneeId
  5. INSERT INTO mx_data.assignee_offices (assignee_data_id, office_id, is_default)
     VALUES (assigneeId, defaultOfficeId, TRUE)
  6. COMMIT
  7. return { assignee_id: assigneeId }
  on error: ROLLBACK → rethrow
```

**Post-success flow в `clients-data-table.tsx`:**

```
function handleAssignSuccess(assigneeIds):
  1. setRowSelection({}) — скинути всі вибрані рядки
  2. для кожного id в assigneeIds:
       window.open(`/mx-job/assignee/${id}`, '_blank')
```

### 7.2 Validation Schemas

Zod-схеми в цьому модулі не використовуються. Валідація відбувається вручну в Server Action:

```typescript
// UUID validation (рядок 67-76 в create-assignee.ts)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Перевірка наявності вибраних
if (!userDataIds || userDataIds.length === 0)  // → VALIDATION_ERROR

// Перевірка офісу
if (!defaultOfficeId || defaultOfficeId <= 0)  // → VALIDATION_ERROR
```

### 7.3 Error Handling Strategy

| Ситуація              | Де обробляється                   | Що повертається                                   | HTTP-еквівалент |
| --------------------- | --------------------------------- | ------------------------------------------------- | --------------- |
| Не авторизований      | `create-assignee.ts`              | `{ status: 'error', code: 'UNAUTHORIZED' }`       | 401             |
| Немає permission_id=2 | `create-assignee.ts`              | `{ status: 'error', code: 'FORBIDDEN' }`          | 403             |
| Порожній список IDs   | `create-assignee.ts`              | `{ status: 'error', code: 'VALIDATION_ERROR' }`   | 400             |
| Невалідний UUID       | `create-assignee.ts`              | `{ status: 'error', code: 'VALIDATION_ERROR' }`   | 400             |
| Особа вже виконавець  | `create-assignee.ts`              | `{ status: 'warning', code: 'ALREADY_ASSIGNEE' }` | 409             |
| Помилка БД            | `create-assignee.ts` → catch      | `{ status: 'error', code: 'DB_ERROR' }`           | 500             |
| Виконавця не знайдено | `assignee/[assignee_id]/page.tsx` | `notFound()` → 404 сторінка                       | 404             |
| Не знайдено user_data | `createAssignee()` в data layer   | `throw Error(...)` → перехоплюється вище          | —               |

---

## 8. Integration Guide (Clean Next.js Project)

> **Assumed baseline**: Next.js 16+ App Router, TypeScript 5 strict, PostgreSQL 17, `pg` pool (без ORM), Better Auth, Zustand, Shadcn UI + Radix UI + Tailwind CSS 4.

### Step 1 — Preconditions

```bash
node --version   # >= 20
# Required env vars (аналогічно існуючому проекту):
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
BETTER_AUTH_SECRET=your-secret
# ... решта Better Auth env vars
```

Передумови в БД:

- Таблиця `mx_data.user_data` (профілі)
- Таблиця `mx_data.user_contact` (контакти)
- Таблиця `mx_dic.offices` (офіси)
- Таблиця `mx_system.user_offices` (призначення офісів)
- Таблиця `mx_system.nav_user_permissions` + `mx_dic.user_permissions_items` (права)
- Функція `mx_data.fn_contact_build_url` (URL контактів)
- View `mx_data.user_data_with_contact_view` або еквівалент
- Запис у `mx_dic.user_permissions_items` з id=2 (право призначення виконавців)

### Step 2 — Встановити компоненти Shadcn

```bash
# Якщо ще не встановлені:
npx shadcn@latest add checkbox
npx shadcn@latest add alert-dialog
npx shadcn@latest add separator
```

### Step 3 — Скопіювати файли (у порядку залежностей)

```
1. sql/mx_dic/dic-posts-assignee.sql             ← нова таблиця довідника
2. sql/mx-data/assignee-data.sql                 ← нові таблиці + view
3. sql/migrations/012_assignee_data_fix_and_offices.sql  ← для живої БД

4. interfaces/mx-data/assignee.ts                ← новий тип AssigneeView
5. interfaces/mx-data/client-view.ts             ← додати поле is_assignee: boolean

6. data/mx-data/assignee.ts                      ← нові data functions
7. data/mx-data/clients.ts                       ← додати is_assignee subquery

8. actions/mx-job/assignee/create-assignee.ts    ← новий server action

9. components/mx-job/clients/clients-columns.tsx ← замінити const array на функцію
10. components/mx-job/clients/clients-data-table.tsx  ← нові props + row selection
11. components/mx-job/clients/clients-table-wrapper.tsx ← оновити: permissions + offices

12. components/mx-job/assignee/assign-assignee-dialog.tsx  ← новий компонент

13. app/(protected)/mx-job/assignee/[assignee_id]/page.tsx ← нова сторінка
```

### Step 4 — Застосувати до БД

**На нову БД:**

```bash
# Запустити повний скрипт або тільки нові таблиці:
psql -U user -d dbname -f sql/mx_dic/dic-posts-assignee.sql
psql -U user -d dbname -f sql/mx-data/assignee-data.sql
```

**На існуючу БД:**

```bash
psql -U user -d dbname -f sql/migrations/012_assignee_data_fix_and_offices.sql
```

### Step 5 — Налаштувати права

Переконатися, що в БД є запис:

```sql
-- permission_id=2 має існувати в mx_dic.user_permissions_items
SELECT * FROM mx_dic.user_permissions_items WHERE id = 2;
-- якщо немає — додати і призначити потрібним користувачам через mx_system.nav_user_permissions
```

### Step 6 — Wire into App

- `clients-table-wrapper.tsx` рендериться на сторінці `/mx-job/clients/`
- Сторінка виконавця доступна за `/mx-job/assignee/[assignee_id]`
- Додати посилання в навігацію — опційно на цьому етапі

### Step 7 — Smoke Test Checklist

```
□ Відкрити /mx-job/clients — таблиця завантажується без помилок
□ Залогінитися як користувач БЕЗ permission_id=2 → checkbox-колонка відсутня
□ Залогінитися як користувач З permission_id=2 → checkbox-колонка видима
□ Клікнути на checkbox виконавця (is_assignee=true) → checkbox disabled, не вибирається
□ Вибрати 1+ рядки → кнопка «Призначити виконавцями» стає активною
□ Клікнути «Призначити виконавцями» → діалог відкривається з іменами та офісом
□ Підтвердити → запис зберігається в assignee_data і assignee_offices
□ Після підтвердження → відкриваються нові вкладки /mx-job/assignee/[id]
□ Після підтвердження → сторінка клієнтів ревалідується, checkbox стає disabled для призначених
□ Відкрити /mx-job/assignee/[valid-id] → відображається full_name та post_assignee_title
□ Відкрити /mx-job/assignee/[invalid-uuid] → 404 сторінка
□ Спробувати призначити вже-виконавця через API → повертається status: 'warning'
```

### Step 8 — Rollback

```bash
# Відкотити таблиці:
psql -U user -d dbname -c "DROP TABLE IF EXISTS mx_data.assignee_offices CASCADE;"
psql -U user -d dbname -c "DROP TABLE IF EXISTS mx_data.assignee_data CASCADE;"
psql -U user -d dbname -c "DROP TABLE IF EXISTS mx_dic.dic_posts_assignee CASCADE;"

# Видалити файли:
# rm -rf actions/mx-job/assignee/
# rm -rf components/mx-job/assignee/
# rm    interfaces/mx-data/assignee.ts
# rm    app/(protected)/mx-job/assignee/ -rf
# rm    data/mx-data/assignee.ts

# Відновити оригінальні версії файлів:
# interfaces/mx-data/client-view.ts — видалити поле is_assignee
# data/mx-data/clients.ts — видалити subquery is_assignee
# components/mx-job/clients/clients-columns.tsx — повернути const array
# components/mx-job/clients/clients-data-table.tsx — видалити нові props + selection
# components/mx-job/clients/clients-table-wrapper.tsx — спростити (без permissions/offices)
```

---

## 9. Testing

### 9.1 Test Coverage Map

| What                                       | Type        | Tool                    | Priority |
| ------------------------------------------ | ----------- | ----------------------- | -------- |
| `createAssigneeAction` — auth check        | Unit        | Vitest                  | High     |
| `createAssigneeAction` — permission check  | Unit        | Vitest                  | High     |
| `createAssigneeAction` — UUID validation   | Unit        | Vitest                  | High     |
| `createAssigneeAction` — already assignee  | Integration | Vitest + testcontainers | High     |
| `createAssignee()` — transaction atomicity | Integration | Vitest + testcontainers | High     |
| `AssignAssigneeDialog` — submit flow       | E2E         | Playwright              | Medium   |
| Checkbox disabled for is_assignee rows     | E2E         | Playwright              | Medium   |

### 9.2 Minimal Test Cases

```typescript
// ✅ Happy path — одиничне призначення
input: createAssigneeAction(['valid-uuid-1'], 1)
context: authorized user with permission_id=2, user_data exists, not yet assignee
expected: { status: 'success', assignee_ids: [string] }
side effect: INSERT in assignee_data + assignee_offices

// ❌ Auth error
context: unauthenticated
expected: { status: 'error', code: 'UNAUTHORIZED' }

// ❌ Permission error
context: authenticated, permission_id=2 відсутній
expected: { status: 'error', code: 'FORBIDDEN' }

// ❌ Invalid UUID
input: createAssigneeAction(['not-a-uuid'], 1)
expected: { status: 'error', code: 'VALIDATION_ERROR' }

// ⚠️ Already assignee
input: createAssigneeAction(['uuid-of-existing-assignee'], 1)
expected: { status: 'warning', code: 'ALREADY_ASSIGNEE' }

// ❌ Empty office
input: createAssigneeAction(['valid-uuid'], 0)
expected: { status: 'error', code: 'VALIDATION_ERROR' }
```

### 9.3 Running Tests

🔴 Tests not implemented in this task — тестів в репозиторії немає на момент реалізації модуля.

---

## 10. Pitfalls & Gotchas

> ⚠️ **Типи `user_id` та `updated_by` — `text`, не `uuid`**
> **Симптом**: `[42804] ERROR: foreign key constraint cannot be implemented. Key columns "user_id" and "id" are of incompatible types: uuid and text`
> **Причина**: Better Auth зберігає `public."user".id` як `text` (не `uuid`). Будь-яка FK на `public."user"` вимагає тип `text`.
> **Рішення**: Колонки `user_id text NULL` та `updated_by text NULL` — завжди `text`, не `uuid`.

> ⚠️ **`DROP FUNCTION` без `CASCADE` падає при повторному запуску**
> **Симптом**: `[2BP01] ERROR: cannot drop function ... because other objects depend on it`
> **Причина**: PostgreSQL не дозволяє видалити функцію, якщо на неї посилається тригер.
> **Рішення**: Завжди використовувати `DROP FUNCTION IF EXISTS ... CASCADE` в `clear_database_create_db_for_new_app.sql`.

> ⚠️ **`CREATE TABLE IF NOT EXISTS` без попереднього `DROP` → дублювання seed-даних**
> **Симптом**: При повторному запуску `clear_database_create_db_for_new_app.sql` INSERT виконується знову → дублікати в довідниках
> **Причина**: Скрипт «з нуля» не видаляв старі таблиці.
> **Рішення**: На початку файлу додано блок `DROP SCHEMA ... CASCADE` + `DROP TABLE` для public таблиць Better Auth. Seed INSERT захищений через `WHERE NOT EXISTS`.

> ⚠️ **Типографічні лапки (`'`, `'`) в SQL COMMENT ламають PostgreSQL**
> **Симптом**: `[42601] ERROR: syntax error at or near "'Профілі'"` при запуску .sql файлу
> **Причина**: Unicode U+2018 та U+2019 (curly quotes) є невалідними символами в PostgreSQL string literals.
> **Рішення**: Замінити всі `'...'` на `'...'` (ASCII apostrophe). Перевіряти .sql файли на наявність Unicode quotes перед запуском.

> ⚠️ **`mx_dic.dic_posts_assignee` відсутня в `clear_database_create_db_for_new_app.sql`**
> **Симптом**: `ERROR: relation "mx_dic.dic_posts_assignee" does not exist` при створенні FK в `assignee_data`
> **Причина**: Нова таблиця довідника не була додана до файлу відтворення з нуля.
> **Рішення**: `dic_posts_assignee` має бути визначена в секції MX_DIC **перед** `mx_data.assignee_data`. Порядок: `offices` → `dic_posts_assignee` → (MX_SYSTEM) → `assignee_data`.

> ⚠️ **TanStack Table v8 несумісний з React Compiler**
> **Симптом**: Попередження React Compiler про автоматичну мемоізацію
> **Причина**: `useReactTable()` повертає функції, що не можуть бути безпечно мемоізовані
> **Рішення**: Коментар `// eslint-disable-next-line react-hooks/incompatible-library` в `ClientsDataTable`. Не потребує додаткових дій — функціональність не порушена.

> ⚠️ **`columns` тепер функція, а не константа — всі споживачі потребують оновлення**
> **Симптом**: TypeScript error `clientsColumns is not a function` або відсутність checkbox-колонки
> **Причина**: `clients-columns.tsx` змінився з `export const clientsColumns` на `export function getClientsColumns(hasAssignPermission)`
> **Рішення**: В `ClientsDataTable` викликати `getClientsColumns(hasAssignPermission)` замість прямого використання масиву колонок.
