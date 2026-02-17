# API Reference - Система повноважень

## Data функції

### Категорії повноважень

#### `getUserPermissionsCategories()`

Отримати всі категорії повноважень.

**Повертає:** `Promise<UserPermissionsCategory[]>`

#### `createUserPermissionsCategory(title, description, icon)`

Створити нову категорію повноважень.

**Параметри:**

- `title: string` - назва категорії
- `description: string | null` - опис категорії
- `icon: string` - назва іконки

**Повертає:** `Promise<UserPermissionsCategory>`

#### `updateUserPermissionsCategory(id, title, description, icon)`

Оновити категорію повноважень.

**Параметри:**

- `id: number` - ID категорії
- `title: string` - нова назва
- `description: string | null` - новий опис
- `icon: string` - нова іконка

**Повертає:** `Promise<void>`

#### `deleteUserPermissionsCategory(id)`

Видалити категорію повноважень.

**Параметри:**

- `id: number` - ID категорії

**Повертає:** `Promise<void>`

#### `toggleUserPermissionsCategoryActive(id, isActive)`

Переключити активність категорії.

**Параметри:**

- `id: number` - ID категорії
- `isActive: boolean` - новий стан активності

**Повертає:** `Promise<void>`

### Пункти повноважень

#### `getUserPermissionsItems()`

Отримати всі пункти повноважень.

**Повертає:** `Promise<UserPermissionsItem[]>`

#### `getUserPermissionsItemsByCategoryId(categoryId)`

Отримати пункти повноважень за категорією.

**Параметри:**

- `categoryId: number` - ID категорії

**Повертає:** `Promise<UserPermissionsItem[]>`

#### `createUserPermissionsItem(categoryId, title, description)`

Створити новий пункт повноваження.

**Параметри:**

- `categoryId: number` - ID категорії
- `title: string` - назва пункту
- `description: string | null` - опис пункту

**Повертає:** `Promise<UserPermissionsItem>`

#### `updateUserPermissionsItem(id, title, description)`

Оновити пункт повноваження.

**Параметри:**

- `id: number` - ID пункту
- `title: string` - нова назва
- `description: string | null` - новий опис

**Повертає:** `Promise<void>`

#### `reorderUserPermissionsItem(id, newSortOrder)`

Змінити порядок сортування пункту.

**Параметри:**

- `id: number` - ID пункту
- `newSortOrder: number` - новий порядковий номер

**Повертає:** `Promise<void>`

#### `deleteUserPermissionsItem(id)`

Видалити пункт повноваження.

**Параметри:**

- `id: number` - ID пункту

**Повертає:** `Promise<void>`

#### `toggleUserPermissionsItemActive(id, isActive)`

Переключити активність пункту.

**Параметри:**

- `id: number` - ID пункту
- `isActive: boolean` - новий стан активності

**Повертає:** `Promise<void>`

### Призначення повноважень

#### `getNavUserPermissionsByUserId(userId)`

Отримати призначені повноваження користувача.

**Параметри:**

- `userId: string` - ID користувача

**Повертає:** `Promise<NavUserPermissions[]>`

#### `getNavUserPermissionsAdminViewByUserId(userId)`

Отримати повну матрицю повноважень для адміністратора.

**Параметри:**

- `userId: string` - ID користувача

**Повертає:** `Promise<NavUserPermissionsAdminView[]>`

#### `getNavUserPermissionsUserViewByUserId(userId)`

Отримати активні повноваження користувача.

**Параметри:**

- `userId: string` - ID користувача

**Повертає:** `Promise<NavUserPermissionsUserView[]>`

#### `insertNavUserPermissionsByUserId(userId, permissionId, createdBy)`

Призначити повноваження користувачу.

**Параметри:**

- `userId: string` - ID користувача
- `permissionId: number` - ID повноваження
- `createdBy: string` - ID адміністратора

**Повертає:** `Promise<NavUserPermissions>`

#### `deleteNavUserPermissions(userId, permissionId)`

Видалити призначення повноваження.

**Параметри:**

- `userId: string` - ID користувача
- `permissionId: number` - ID повноваження

**Повертає:** `Promise<void>`

#### `getUserPermission(userId, permissionId)`

Перевірити чи має користувач конкретне повноваження.

**Параметри:**

- `userId: string` - ID користувача
- `permissionId: number` - ID повноваження

**Повертає:** `Promise<boolean>`

## Server Actions

### Управління категоріями та пунктами

#### `createPermissionCategoryAction(title, description, icon)`

#### `updatePermissionCategoryTitleAction(id, title)`

#### `updatePermissionCategoryDescriptionAction(id, description)`

#### `updatePermissionCategoryIconAction(id, icon)`

#### `deletePermissionCategoryAction(id)`

#### `togglePermissionCategoryActiveAction(id, isActive)`

#### `createPermissionItemAction(categoryId, title, description)`

#### `updatePermissionItemTitleAction(id, title)`

#### `updatePermissionItemDescriptionAction(id, description)`

#### `deletePermissionItemAction(id)`

#### `togglePermissionItemActiveAction(id, isActive)`

#### `reorderPermissionItems(items)`

### Призначення користувачам

#### `toggleUserPermissionAction(userId, permissionId, isActive)`

#### `toggleUserPermissionCategoryAction(userId, categoryId, isActive)`

#### `getUserPermissionsDataAction(userId)`

## Hooks та утилити

### `useHasPermission(permissionId)`

Hook для перевірки повноваження в Client Components.

**Параметри:**

- `permissionId: number` - ID повноваження

**Повертає:** `boolean`

### `useUserPermissions()`

Hook для отримання всіх повноважень користувача.

**Повертає:** `UserPermission[]`

### `getUserPermissions(userId)`

Функція для отримання повноважень у Server Components.

**Параметри:**

- `userId: string` - ID користувача

**Повертає:** `Promise<UserPermission[]>`

## Zustand Store

### `useUserPermissionsStore`

**Стани:**

- `permissions: UserPermission[]` - масив повноважень
- `isInitialized: boolean` - чи ініціалізовано store

**Методи:**

- `setPermissions(permissions)` - встановити повноваження
- `updatePermissions(permissions)` - оновити повноваження
- `clearPermissions()` - очистити повноваження
- `hasPermission(permissionId)` - перевірити наявність повноваження
