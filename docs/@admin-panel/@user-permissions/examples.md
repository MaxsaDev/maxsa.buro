# Приклади використання системи повноважень

## Базові приклади

### Приклад 1: Перевірка повноваження в Client Component

```typescript
'use client';

import { useHasPermission } from '@/lib/permissions/check-permission';

export function FinancialReportsButton() {
  // Перевіряємо чи має користувач повноваження з ID 52
  // ID можна побачити на сторінці /mx-admin/permissions
  const hasPermission = useHasPermission(52);

  if (!hasPermission) return null;

  return (
    <button
      onClick={() => {
        // Відкрити налаштування звіту
        console.log('Відкриваємо налаштування звіту');
      }}
      className="btn btn-primary"
    >
      Налаштування звіту
    </button>
  );
}
```

### Приклад 2: Умовний рендеринг на основі повноважень

```typescript
'use client';

import { useUserPermissions } from '@/lib/permissions/check-permission';

export function UserDashboard() {
  const permissions = useUserPermissions();

  // Перевіряємо наявність конкретних повноважень
  // Використовуємо напряму числові ID з БД
  // ID можна побачити на сторінці /mx-admin/permissions
  const canCreateDocs = permissions.some(p => p.permission_id === 1);
  const canViewReports = permissions.some(p => p.permission_id === 3);
  const canManageCash = permissions.some(p => p.permission_id === 2);

  return (
    <div className="space-y-4">
      {canCreateDocs && (
        <div>
          <h3>Створення документації</h3>
          <CreateDocumentButton />
        </div>
      )}

      {canViewReports && (
        <div>
          <h3>Звіти</h3>
          <ViewReportsButton />
        </div>
      )}

      {canManageCash && (
        <div>
          <h3>Каса</h3>
          <CashOperationsButton />
        </div>
      )}
    </div>
  );
}
```

### Приклад 3: Перевірка повноваження в Server Component

```typescript
import { getUserPermission } from '@/data/mx-system/nav-user-permissions';
import { getCurrentUser } from '@/lib/auth/auth-server';

export default async function FinancialReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Перевіряємо повноваження для перегляду звітів
  const hasPermission = await getUserPermission(user.id, 52);

  if (!hasPermission) {
    return (
      <div>
        <h1>Доступ заборонено</h1>
        <p>У вас немає прав для перегляду цієї сторінки.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Фінансові звіти</h1>
      {/* Контент сторінки */}
    </div>
  );
}
```

### Приклад 4: Перевірка кількох повноважень

```typescript
'use client';

import { useUserPermissions } from '@/lib/permissions/check-permission';

export function AdminPanel() {
  const permissions = useUserPermissions();
  const permissionIds = new Set(permissions.map(p => p.permission_id));

  // Перевіряємо наявність кількох повноважень
  const canManageUsers = permissionIds.has(10);
  const canManagePermissions = permissionIds.has(11);
  const canViewAnalytics = permissionIds.has(12);

  return (
    <div>
      {canManageUsers && <UserManagementSection />}
      {canManagePermissions && <PermissionsManagementSection />}
      {canViewAnalytics && <AnalyticsSection />}
    </div>
  );
}
```

### Приклад 5: Фільтрація контенту на основі повноважень

```typescript
'use client';

import { useUserPermissions } from '@/lib/permissions/check-permission';

interface MenuItem {
  id: number;
  title: string;
  permissionId?: number;
  href: string;
}

const menuItems: MenuItem[] = [
  { id: 1, title: 'Головна', href: '/' },
  { id: 2, title: 'Звіти', permissionId: 3, href: '/reports' },
  { id: 3, title: 'Каса', permissionId: 2, href: '/cash' },
  { id: 4, title: 'Документація', permissionId: 1, href: '/docs' },
];

export function UserMenu() {
  const permissions = useUserPermissions();
  const permissionIds = new Set(permissions.map(p => p.permission_id));

  // Фільтруємо пункти меню на основі повноважень
  const visibleItems = menuItems.filter(item => {
    // Якщо у пункту немає permissionId, він доступний всім
    if (!item.permissionId) return true;
    // Інакше перевіряємо наявність повноваження
    return permissionIds.has(item.permissionId);
  });

  return (
    <nav>
      {visibleItems.map(item => (
        <a key={item.id} href={item.href}>
          {item.title}
        </a>
      ))}
    </nav>
  );
}
```

### Приклад 6: Використання з Server Actions

```typescript
'use server';

import { getUserPermission } from '@/data/mx-system/nav-user-permissions';
import { getCurrentUser } from '@/lib/auth/auth-server';

export async function generateReportAction(reportType: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Не авторизовано');
  }

  // Перевіряємо повноваження для генерації звітів
  const hasPermission = await getUserPermission(user.id, 52);

  if (!hasPermission) {
    return {
      status: 'error',
      message: 'У вас немає прав для генерації звітів',
      code: 'FORBIDDEN',
    };
  }

  // Генеруємо звіт
  // ...

  return {
    status: 'success',
    message: 'Звіт успішно згенеровано',
  };
}
```

### Приклад 7: Захист маршруту на основі повноважень

```typescript
import { getUserPermission } from '@/data/mx-system/nav-user-permissions';
import { getCurrentUser } from '@/lib/auth/auth-server';
import { redirect } from 'next/navigation';

export default async function ProtectedReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Перевіряємо повноваження
  const hasPermission = await getUserPermission(user.id, 52);

  if (!hasPermission) {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1>Захищена сторінка звітів</h1>
      {/* Контент */}
    </div>
  );
}
```

### Приклад 8: Динамічне відображення кнопок на основі повноважень

```typescript
'use client';

import { useHasPermission } from '@/lib/permissions/check-permission';

export function DocumentActions({ documentId }: { documentId: number }) {
  // Використовуємо напряму числові ID з БД
  // ID можна побачити на сторінці /mx-admin/permissions
  const canEdit = useHasPermission(1); // Створення документації
  const canDelete = useHasPermission(4); // Видалення документації
  const canPublish = useHasPermission(5); // Публікація документації

  return (
    <div className="flex gap-2">
      {canEdit && (
        <button onClick={() => editDocument(documentId)}>
          Редагувати
        </button>
      )}
      {canDelete && (
        <button onClick={() => deleteDocument(documentId)}>
          Видалити
        </button>
      )}
      {canPublish && (
        <button onClick={() => publishDocument(documentId)}>
          Опублікувати
        </button>
      )}
    </div>
  );
}
```

## Рекомендації

1. **Використовуйте напряму числові ID з БД** - це найпростіший і найнадійніший підхід:

   ```typescript
   // Просто використовуйте ID з бази даних
   const hasPermission = useHasPermission(115); // ID з БД
   ```

   ID можна побачити на сторінці `/mx-admin/permissions` - вони відображаються поруч з назвами.

2. **Константи - опціонально** - файл `lib/permissions/permission-ids.ts` створено для тих, хто хоче використовувати константи, але це не обов'язково. Переваги констант (автодополнення, рефакторинг) не переважають недоліки (додатковий крок, ризик помилок).

3. **Кешуйте результати перевірок** - використовуйте Zustand store для кешування повноважень

4. **Перевіряйте повноваження на сервері** - для критичних операцій завжди перевіряйте на сервері

5. **Додавайте коментарі з описом** - при використанні ID додавайте коментар з назвою повноваження:
   ```typescript
   // Доступ до контактних даних клієнтів
   const hasPermission = useHasPermission(115);
   ```
