# Система повноважень користувачів

## Огляд

Система повноважень дозволяє адміністратору надавати користувачам конкретні права доступу до функціоналу додатку. На відміну від ролей (адміністратор/користувач), повноваження дозволяють гнучко налаштовувати доступ до окремих функцій.

## Архітектура

### Структура бази даних

Система повноважень складається з двох рівнів:

1. **Категорії повноважень** (`mx_dic.user_permissions_category`)
   - Групування повноважень за тематикою
   - Містить: id, title, description, icon, is_active

2. **Пункти повноважень** (`mx_dic.user_permissions_items`)
   - Конкретні повноваження всередині категорій
   - Містить: id, category_id, title, description, sort_order, is_active

3. **Призначення повноважень** (`mx_system.nav_user_permissions`)
   - Зв'язок між користувачами та повноваженнями
   - Містить: id, user_id, permission_id, created_at, created_by

### VIEW для роботи з даними

- `mx_system.nav_user_permissions_admin_view` - повна матриця для адміністратора
- `mx_system.nav_user_permissions_user_view` - активні повноваження користувача

## Використання

### Для адміністратора

#### Створення категорій та пунктів повноважень

1. Перейдіть до `/mx-admin/permissions`
2. У вкладці "Категорії повноважень":
   - Створіть нову категорію
   - Додайте пункти повноважень до категорії
   - Налаштуйте активність категорій та пунктів

#### Призначення повноважень користувачам

1. Перейдіть до `/mx-admin/user-data/[user_id]`
2. Відкрийте вкладку "Доступи користувача"
3. Клікніть на категорію або конкретний пункт для активації/деактивації

### Для розробника

#### Перевірка повноважень у коді

**У Server Components:**

```typescript
import { getUserPermission } from '@/data/mx-system/nav-user-permissions';

const hasPermission = await getUserPermission(userId, permissionId);
if (hasPermission) {
  // Рендеримо функціонал
}
```

**У Client Components:**

```typescript
import { useHasPermission } from '@/lib/permissions/check-permission';
import { PERMISSION_IDS } from '@/lib/permissions/permission-ids';

function MyComponent() {
  // Використовуємо константу з permission-ids.ts
  const hasPermission = useHasPermission(PERMISSION_IDS.CREATE_DOCS_CATEGORIES);

  if (!hasPermission) return null;

  return <button>Доступна функція</button>;
}
```

**Де знайти ID повноважень:**

- На сторінці `/mx-admin/permissions` - ID відображаються поруч з назвами категорій та пунктів
- На сторінці `/mx-admin/user-data/[user_id]` → вкладка "Доступи користувача" - ID відображаються поруч з назвами повноважень

#### Отримання всіх повноважень користувача

```typescript
import { useUserPermissions } from '@/lib/permissions/check-permission';

function MyComponent() {
  const permissions = useUserPermissions();
  // permissions - масив об'єктів з permission_id, permission_title, category_id, category_title
}
```

## Структура файлів

### SQL файли

- `sql/mx_dic/user_permissions_category.sql` - таблиця категорій
- `sql/mx_dic/user_permissions_items.sql` - таблиця пунктів
- `sql/mx_dic/user_permissions_items_fn.sql` - функції для сортування
- `sql/mx_dic/user_permissions_category_active_fn.sql` - синхронізація активності
- `sql/mx-system/nav_user_permissions.sql` - призначення та VIEW

### TypeScript інтерфейси

- `interfaces/mx-dic/user-permissions.ts` - інтерфейси категорій та пунктів
- `interfaces/mx-system/nav-user-permissions.ts` - інтерфейси призначень

### Data функції

- `data/mx-dic/user-permissions.ts` - CRUD операції для категорій та пунктів
- `data/mx-system/nav-user-permissions.ts` - робота з призначеннями

### Server Actions

- `actions/mx-admin/permissions/` - управління категоріями та пунктами
- `actions/mx-admin/user-data/` - призначення повноважень користувачам

### UI компоненти

- `components/mx-admin/permissions/` - компоненти для управління повноваженнями
- `components/mx-admin/user-data/user-permissions.tsx` - компонент призначення

### Store та утилити

- `store/user-permissions/user-permissions-store.ts` - Zustand store
- `lib/permissions/get-user-permissions.ts` - функція для Server Components
- `lib/permissions/check-permission.ts` - hooks для Client Components
- `lib/permissions/permission-ids.ts` - константи ID повноважень для використання в коді
- `components/permissions-provider.tsx` - Provider для ініціалізації

## Особливості реалізації

1. **Автоматичне сортування** - пункти повноважень автоматично сортуються в межах категорії
2. **Синхронізація активності** - при деактивації категорії автоматично деактивуються всі пункти
3. **Drag & Drop** - можливість зміни порядку пунктів перетягуванням
4. **Оптимістичні оновлення** - UI оновлюється одразу, без очікування відповіді сервера
5. **Кешування** - повноваження користувача зберігаються в Zustand store

## Приклади використання

### Приклад: Показ кнопки тільки для користувачів з повноваженням

```typescript
'use client';

import { useHasPermission } from '@/lib/permissions/check-permission';

export function FinancialReportsButton() {
  // Використовуємо напряму числовий ID з БД
  // ID 52 відповідає повноваженню "Фінансові звіти за місяць"
  // ID можна побачити на сторінці /mx-admin/permissions
  const hasPermission = useHasPermission(52);

  if (!hasPermission) return null;

  return (
    <button onClick={() => {/* відкрити налаштування звіту */}}>
      Налаштування звіту
    </button>
  );
}
```

### Приклад: Умовний рендеринг на основі повноважень

```typescript
'use client';

import { useUserPermissions } from '@/lib/permissions/check-permission';

export function UserDashboard() {
  const permissions = useUserPermissions();
  // Використовуємо напряму числові ID з БД
  // ID можна побачити на сторінці /mx-admin/permissions
  const canCreateDocs = permissions.some(p => p.permission_id === 1);
  const canViewReports = permissions.some(p => p.permission_id === 3);

  return (
    <div>
      {canCreateDocs && <CreateDocumentButton />}
      {canViewReports && <ViewReportsButton />}
    </div>
  );
}
```

## Додаткова інформація

Для детальної інформації про API та приклади використання дивіться:

- [API Reference](./api-reference.md)
- [Usage Guide](./usage-guide.md)
- [Examples](./examples.md)
