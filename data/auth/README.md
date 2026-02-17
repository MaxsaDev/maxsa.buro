# Data Layer - Auth

Цей каталог містить всі функції для роботи з базою даних в частині аутентифікації.

## 📁 Структура

```
data/auth/
├── types.ts       # TypeScript типи для auth схеми
├── user.ts        # Функції роботи з користувачами
└── README.md      # Ця документація
```

## 📝 Принципи

✅ **Всі SQL запити тільки тут** - ніяких прямих запросів в actions або lib
✅ **Чисті функції БД** - тільки CRUD операції, без бізнес-логіки
✅ **TypeScript типи** - всі типи БД експортуються з `types.ts`
✅ **snake_case в SQL** - відповідність схемі БД
✅ **Error handling** - всі помилки логуються та пробрасуються

## 🔧 Використання

### Отримати роль користувача

```typescript
import { getUserRole } from '@/data/auth/user';

const role = await getUserRole(userId);
// returns: 'user' | 'admin' | null
```

### Перевірити чи заблокований

```typescript
import { isUserBanned } from '@/data/auth/user';

const banned = await isUserBanned(userId);
// returns: boolean
```

### Змінити роль

```typescript
import { updateUserRole } from '@/data/auth/user';

await updateUserRole(userId, 'admin');
```

### Заблокувати/Розблокувати

```typescript
import { banUserById, unbanUserById } from '@/data/auth/user';

await banUserById(userId);
await unbanUserById(userId);
```

### Отримати користувача

```typescript
import { getUserById, getUserByEmail } from '@/data/auth/user';

const user = await getUserById(userId);
const user = await getUserByEmail('email@example.com');
```

## 🎯 Типи

Всі типи експортуються з `types.ts`:

```typescript
import type { User, UserRole, Session } from '@/data/auth/types';
import { USER_ROLES } from '@/data/auth/types';

// UserRole = 'user' | 'admin'
// USER_ROLES.USER = 'user'
// USER_ROLES.ADMIN = 'admin'
```

## 🔒 Безпека

- **Всі функції `'use server'`** - виконуються тільки на сервері
- **Валідація входів** - всі вхідні дані валідуються
- **SQL injection захист** - використання параметризованих запитів
- **Error logging** - всі помилки логуються з префіксом `[Data Auth User]`

## 📊 Схема БД

Всі таблиці в схемі `auth`:

- `auth.user` - користувачі
- `auth.session` - сесії
- `auth.account` - OAuth аккаунти
- `auth.verification` - верифікація email
- `auth.two_factor` - 2FA дані
- `auth.passkey` - WebAuthn ключі
