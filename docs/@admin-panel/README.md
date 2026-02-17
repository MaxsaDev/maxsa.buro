# Адміністративна панель

## Опис

Документація модулів адміністративної панелі для управління системою та користувачами.

## Модулі

### 1. Управління користувачами

**Файл**: [users-management.md](./users-management.md)

Повний функціонал для управління користувачами системи:

- Перегляд списку всіх користувачів
- Глобальний пошук (fuzzy search)
- Зміна ролей (user ↔ admin)
- Керування безпекою (2FA, Passkey)
- Модерація (бан/розбан)
- Видалення користувачів

### 2. Налаштування меню додатку

**Папка**: [settings-menu-app](./settings-menu-app/)

Функціонал редагування динамічних меню додатку через адміністративну панель:

- Редагування меню користувача з секціями та пунктами
- Редагування меню користувача з пунктами
- Редагування меню підтримки додатку
- Drag-and-drop для зміни порядку пунктів
- Управління активністю пунктів меню

**Документація**: [README.md](./settings-menu-app/README.md)
**TODO**: [TODO.md](./settings-menu-app/TODO.md) - список завдань для реалізації

## Доступ

Всі модулі адміністративної панелі доступні тільки користувачам з роллю `admin`.

### Перевірка доступу на сторінці

```typescript
const user = await getCurrentUser();
if (!user || user.role !== 'admin') {
  redirect('/dashboard');
}
```

### Перевірка доступу в Server Actions

```typescript
const currentUser = await getCurrentUser();
if (!currentUser || currentUser.role !== 'admin') {
  return { success: false, error: 'Недостатньо прав' };
}
```

## Структура файлів

```
app/(protected)/mx-admin/
├── page.tsx              # Головна сторінка адмін-панелі
└── users/
    └── page.tsx          # Управління користувачами

components/mx-admin/
└── users/                # Компоненти управління користувачами
    ├── toggle-role-button.tsx
    ├── disable-two-factor-button.tsx
    ├── disable-passkey-button.tsx
    ├── resend-verification-button.tsx
    ├── toggle-ban-button.tsx
    └── delete-user-button.tsx

actions/auth/
├── toggle-user-role.ts   # Зміна ролі
├── disable-two-factor.ts # Відключення 2FA
├── disable-passkey.ts    # Відключення Passkey
├── toggle-ban.ts         # Бан/розбан
└── delete-user.ts        # Видалення користувача
```

## Маршрути

- `/mx-admin` - Головна сторінка адмін-панелі
- `/mx-admin/users` - Управління користувачами
- `/mx-admin/menu-app` - Налаштування меню додатку

## Особливості реалізації

### React Server Components

Всі сторінки адмін-панелі використовують RSC для максимальної продуктивності:

- Дані завантажуються на сервері
- Мінімальний клієнтський JavaScript
- SEO-friendly

### Server Actions

Всі мутації виконуються через Server Actions:

- Безпечне виконання на сервері
- Автоматична валідація CSRF
- Повна типізація TypeScript

### Optimistic Updates

Використовується `revalidatePath` для оновлення даних після змін:

```typescript
revalidatePath('/mx-admin/users');
```

## UI/UX Рішення

### Підтвердження дій

Всі критичні дії вимагають підтвердження:

- AlertDialog для звичайних дій
- Спеціальний діалог з вводом "DELETE" для видалення

### Toast-повідомлення

Всі результати дій відображаються через toast (Sonner):

- Успішні дії - зелені
- Помилки - червоні
- Інформаційні - сині

### Доступність (a11y)

- Всі кнопки мають aria-label
- Tooltip підказки для всіх іконок
- Правильна семантика HTML
- Підтримка клавіатурної навігації

## Безпека

### Захист маршрутів

```typescript
export default async function Layout({ children }) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
```

### Захист Server Actions

- Перевірка авторизації
- Перевірка ролі
- Валідація даних
- Логування критичних дій

### SQL Injection

- Параметризовані запити
- Pool.query з плейсхолдерами

### XSS Protection

- React автоматично екранує дані
- HTML entities в текстах

## Логування

### Формат логів

```typescript
console.log('[Admin Panel] Дія виконана:', {
  admin: adminEmail,
  target: targetUserId,
  action: 'delete_user',
  timestamp: new Date().toISOString(),
});
```

### Важливі події для логування

- Зміна ролей користувачів
- Бан/розбан користувачів
- Видалення користувачів
- Відключення 2FA/Passkey

## Майбутні модулі

- [ ] Статистика системи
- [ ] Управління контентом
- [ ] Audit Log (історія дій)
- [ ] Налаштування системи
- [ ] Резервне копіювання

## Технічний стек

- **Next.js 16** - App Router, RSC
- **React 19** - з React Compiler
- **TypeScript** - повна типізація
- **TanStack Table v8** - таблиці
- **Shadcn UI** - UI компоненти
- **PostgreSQL 17** - база даних
- **Better Auth** - автентифікація

## Версії

### v1.0 (2025-11-12)

- Управління користувачами
- Базова структура адмін-панелі
- Повна сумісність з Next.js 16 + React Compiler

## Технічна документація

### React Compiler Compatibility

**Файл**: [react-compiler-compatibility.md](./react-compiler-compatibility.md)

Детальна інформація про:

- Обмеження TanStack Table з React Compiler
- Реалізовані рішення та workarounds
- Архітектурні підходи для мінімізації впливу
- Плани оновлення при виході TanStack Table v9
