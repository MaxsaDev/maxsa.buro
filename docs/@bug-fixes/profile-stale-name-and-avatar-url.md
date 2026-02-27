# Bug Fix: Застаріле ім'я профілю та неправильний URL аватара

**Дата**: 27 лютого 2026
**Гілка**: `dev-20260225-assignee-page`
**Версія**: 0.0.28+

---

## Описані проблеми

Дві незалежні проблеми у розділі профілю користувача.

---

## Проблема 1: Після зміни псевдоніма відображається старе ім'я

### Симптом

Користувач змінює псевдонім через форму на сторінці `/profile`. Toast повідомляє «Псевдонім успішно оновлено». Нове ім'я зберігається в БД. Але UI продовжує відображати старе ім'я — ні після `router.refresh()`, ні після повного перезавантаження сторінки браузером.

### Технічний аналіз

#### Ланцюг передачі даних

```
updateNameAction (actions/profile/update-name.ts)
    → updateUserName(user.id, newName) — оновлює БД ✅
    → revalidatePath('/profile') — скидає Next.js кеш ✅
    ↓
router.refresh() (components/profile/profile-info.tsx)
    → перерендер серверного layout ✅
    ↓
ProtectedLayout (app/(protected)/layout.tsx)
    → getCurrentUser() → auth.api.getSession() — читає сесію з cookie ❌
    → getUserById(sessionUser.id) — читає з БД тільки image ❌
    → user = { ...sessionUser, image: dbUser.image }
    → name береться зі sessionUser (= з cookie) ❌
    ↓
UserProvider → useUser() → ProfileInfo → відображає старе ім'я ❌
```

#### Де була помилка

Better Auth конфігурований з кешуванням сесії в cookie:

```typescript
// lib/auth/auth.ts
session: {
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // 5 хвилин
  },
},
```

`getCurrentUser()` повертає дані з сесійного cookie, а не з БД:

```typescript
// lib/auth/auth-server.ts
export const getCurrentUser = async () => {
  const session = await getSession(); // читає з кешованого cookie
  return session?.user ?? null;
};
```

У `ProtectedLayout` вже був прецедент: `image` явно перезаписувався з БД, бо Better Auth також кешує його в сесії. Але `name` залишався з кешованої сесії:

```typescript
// app/(protected)/layout.tsx — БУЛО (помилково)
const user: ExtendedUser = {
  ...sessionUser,
  image: dbUser.image || null, // ✅ з БД
  // name: sessionUser.name   // ❌ неявно з cookie (застаріле!)
};
```

Таким чином, навіть після `revalidatePath` і `router.refresh()`:

1. Next.js RSC кеш скидається ✅
2. Layout перерендерується ✅
3. `getCurrentUser()` повертає ту саму cookie з TTL 5 хвилин ❌
4. `name` у `UserProvider` залишається старим ❌

#### Чому не рятував `router.refresh()`

`router.refresh()` скидає RSC-кеш і перерендерує серверні компоненти. Але він не інвалідує HTTP-cookie. `auth.api.getSession()` при наявному кешованому cookie повертає його вміст без звернення до БД.

### Виправлення

**`app/(protected)/layout.tsx`** — `name` тепер також береться з БД, як і `image`:

```typescript
// СТАЛО
const user: ExtendedUser = {
  ...sessionUser,
  name: dbUser.name, // ✅ з БД (сесія кешується на 5 хв)
  image: dbUser.image || null, // ✅ з БД
};
```

`getUserById` вже вибирав поле `name` з таблиці `"user"` — змін у SQL-запиті не знадобилось.

---

## Проблема 2: Аватар не відображається після завантаження

### Симптом

Користувач завантажує аватар. Toast повідомляє «Аватар успішно завантажено». Шлях до файлу коректно записується в БД: `/avatars/userId/filename.jpg`. Але аватар на сторінці не з'являється — `<img>` або `<Image>` повертає помилку або показує broken image.

### Технічний аналіз

Дві незалежні причини, що діяли одночасно.

#### Причина A: Подвійний слеш у URL

```typescript
// lib/const.ts
export const AWS_S3_STORAGE_URL = 'https://inter-app2.s3.eu-north-1.amazonaws.com/';
//                                                                                   ↑ trailing slash

// lib/avatar/build-avatar-url.ts — БУЛО (помилково)
const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
// imagePath з БД: '/avatars/userId/filename.jpg'
// normalizedPath: '/avatars/userId/filename.jpg' (провідний / залишений)
return `${AWS_S3_STORAGE_URL}${normalizedPath}`;
// Результат: 'https://inter-app2.s3.eu-north-1.amazonaws.com//avatars/userId/filename.jpg'
//                                                             ↑↑ подвійний slash → 403/404 на S3
```

Логіка `normalizedPath` була написана з припущенням, що `AWS_S3_STORAGE_URL` **не** містить trailing slash. Але константа закінчується на `/`. В результаті утворювався URL з подвійним `//` після домену, який S3 відхиляє.

#### Причина B: Домен не дозволений у `next/image`

Next.js компонент `<Image>` вимагає явного списку дозволених зовнішніх доменів у `next.config.ts`. Без цього будь-який зовнішній URL блокується з помилкою:

```
Error: Invalid src prop (...amazonaws.com/...) on `next/image`,
hostname is not configured under images in your `next.config.js`
```

`next.config.ts` не містив жодних `remotePatterns` — конфіг був порожнім.

### Виправлення

**`lib/avatar/build-avatar-url.ts`** — виправлено нормалізацію шляху:

```typescript
// СТАЛО
// AWS_S3_STORAGE_URL закінчується на '/', тому видаляємо провідний '/' з imagePath
const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
return `${AWS_S3_STORAGE_URL}${normalizedPath}`;
// Результат: 'https://inter-app2.s3.eu-north-1.amazonaws.com/avatars/userId/filename.jpg' ✅
```

**`next.config.ts`** — додано `remotePatterns` для S3 бакета:

```typescript
// СТАЛО
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'inter-app2.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};
```

> **Увага**: зміни в `next.config.ts` вступають в силу лише після **перезапуску dev-сервера**.

---

## Змінені файли

| Файл                             | Зміна                                                                |
| -------------------------------- | -------------------------------------------------------------------- |
| `app/(protected)/layout.tsx`     | `name: dbUser.name` — перезапис з БД (аналогічно до `image`)         |
| `lib/avatar/build-avatar-url.ts` | `imagePath.slice(1)` замість `imagePath` — прибрано подвійний slash  |
| `next.config.ts`                 | Додано `remotePatterns` для `inter-app2.s3.eu-north-1.amazonaws.com` |

---

## Урок: Поля сесії Better Auth — ненадійне джерело для відображення

**Правило**: Better Auth кешує дані користувача в сесійному cookie (`cookieCache.maxAge: 5 * 60`). Будь-яке поле, яке може змінюватись через server action (наприклад, `name`, `image`), **не можна** читати зі `sessionUser` для відображення в UI — воно може бути застарілим до 5 хвилин.

Правильний підхід у `ProtectedLayout`:

```typescript
// Завжди читати змінювані поля явно з БД
const user: ExtendedUser = {
  ...sessionUser, // стабільні дані: id, email, role, createdAt
  name: dbUser.name, // змінюване поле → з БД
  image: dbUser.image, // змінюване поле → з БД
};
```

**Правило**: URL для зовнішніх сервісів (S3, CDN) — завжди перевіряти trailing slash у базовому URL та провідний slash у відносному шляху, щоб уникнути подвійного `//`.

---

**Автор**: Claude Sonnet 4.6 + maxsa
