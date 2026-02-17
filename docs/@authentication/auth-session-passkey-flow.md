## Название задачи

Стабилизация авторизации (email/password, Google OAuth, Passkey) в production и устранение редирект‑петли `/login` ↔ `/dashboard`.

## Краткое описание

Документ описывает финальную реализацию стабильного входа в production:

- корректная обработка Secure‑cookie в middleware;
- корректный базовый URL в серверных и клиентских вызовах Better Auth;
- корректный RP ID для WebAuthn/Passkey;
- детерминированный переход на `/dashboard` после Passkey‑входа.

Цель — восстановить рабочие входы во всех сценариях и исключить расхождения домена/куки в production.

---

## Применённые библиотеки и технологии

- **Next.js 16 (App Router)** — серверные маршруты, Server Components, middleware.
- **Better Auth 5.x** — единый провайдер сессий, OAuth (Google), Passkey (WebAuthn).
- **better-auth/next-js (nextCookies)** — корректная установка cookie в server‑контексте.
- **WebAuthn (Passkey)** — безпарольная аутентификация.
- **Zustand** — не участвует в этой задаче, но присутствует в проекте.

Почему это использовано:

- Better Auth обеспечивает единый источник истины для сессий и OAuth/Passkey.
- nextCookies гарантирует установку cookie в Server Actions и API handlers.
- WebAuthn требует строгой настройки RP ID и origin для production‑домена.

---

## Архитектурные решения и подходы

1. **Единый базовый URL**
   - Все серверные и клиентские интеграции используют `getBaseUrl()` как единый источник.
   - Приоритет: `NEXT_PUBLIC_APP_URL` → `BETTER_AUTH_URL` → `VERCEL_URL` → `http://localhost:3000`.

2. **Middleware проверяет только наличие cookie**
   - Middleware не валидирует сессию — это делает Server Component в `app/(protected)/layout.tsx`.
   - В production Better Auth использует префикс `__Secure-`, поэтому проверяем **оба** имени cookie.

3. **Passkey‑вход ждёт появления сессии**
   - После `authClient.signIn.passkey()` есть небольшой временной лаг до появления cookie.
   - Редирект выполняется только после подтверждения сессии через `authClient.getSession()`.

4. **RP ID берётся из переменной окружения или домена**
   - Для Passkey критично совпадение RP ID и домена.
   - Если `WEBAUTHN_RP_ID` не задан, берём домен из `getBaseUrl()` и нормализуем `www.`.

---

## Описание файлов и ключевой логики

### 1) `lib/auth/base-url.ts`

**Роль:** единый источник базового URL.

**Публичные функции:**

- `getBaseUrl()` — возвращает корректный base URL для клиента и сервера.

**Алгоритм (псевдокод):**

```
if window.origin exists -> return it
if NEXT_PUBLIC_APP_URL -> return it
if BETTER_AUTH_URL -> return it
if VERCEL_URL -> return https://VERCEL_URL
return http://localhost:3000
```

---

### 2) `lib/auth/auth.ts`

**Роль:** серверная конфигурация Better Auth.

**Ключевое:**

- `baseURL` использует `getBaseUrl()`.
- `nextCookies()` должен быть последним плагином.
- В production включены `useSecureCookies`.
- OAuth redirect URI собирается от `BASE_URL`.

---

### 3) `lib/auth/auth-client.ts`

**Роль:** клиентская интеграция Better Auth.

**Ключевое:**

- `baseURL` использует `getBaseUrl()` для синхронизации домена клиента/сервера.

---

### 4) `lib/auth/passkey/const-passkey.ts`

**Роль:** конфигурация Passkey/WebAuthn.

**Ключевое:**

- `RP_ID`:
  - сначала `WEBAUTHN_RP_ID`;
  - иначе домен из `getBaseUrl()` без `www.`.
- `ORIGIN` = `getBaseUrl()`.

**Псевдокод RP ID:**

```
if WEBAUTHN_RP_ID -> return it
hostname = new URL(getBaseUrl()).hostname
if hostname starts with "www." -> remove prefix
return hostname
on error -> "localhost"
```

---

### 5) `proxy.ts`

**Роль:** middleware, который защищает `/dashboard`, `/profile`, `/mx-admin`.

**Ключевое:**

- проверяем наличие cookie:
  - `__Secure-better-auth.session_token`
  - `better-auth.session_token`
- если cookie нет → редирект на `/login?redirect=...`.

**Псевдокод:**

```
if route is protected:
  hasSession = cookie "__Secure-better-auth.session_token" OR "better-auth.session_token"
  if !hasSession -> redirect to /login?redirect=pathname
return next()
```

---

### 6) `app/(protected)/layout.tsx`

**Роль:** финальная проверка авторизации на сервере.

**Ключевое:**

- `getCurrentUser()` — единственный источник истины.
- при отсутствии пользователя → `redirect('/login')`.
- загрузка меню и прав — после подтверждения пользователя.

---

### 7) `components/passkey/passkey-login.tsx`

**Роль:** клиентская кнопка входа через Passkey.

**Ключевое:**

- `type="button"` чтобы не триггерить сабмит формы.
- `waitForSession()` ждёт появления сессии.
- после появления сессии → `router.replace('/dashboard')`.
- fallback: `window.location.assign('/dashboard')` если сессия не появилась за таймаут.

**Алгоритм (псевдокод):**

```
on click:
  call authClient.signIn.passkey()
  if error -> show toast and exit
  show success toast
  waitForSession:
    repeat up to 6 times:
      if authClient.getSession().user exists -> success
      wait 200ms
  if session exists -> router.replace('/dashboard'); router.refresh()
  else -> window.location.assign('/dashboard')
```

---

## Переменные окружения (Production)

Обязательные:

- `NEXT_PUBLIC_APP_URL=https://www.maxsa.website`
- `BETTER_AUTH_URL=https://www.maxsa.website`
- `WEBAUTHN_RP_ID=maxsa.website`

Дополнительно:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `BETTER_AUTH_SECRET` или `AUTH_SECRET`

Важно: `WEBAUTHN_RP_ID` должен совпадать с базовым доменом (без `www`) для корректной работы Passkey на `www`‑домене.

---

## Интеграция в новом проекте (пошагово)

1. Установить Better Auth + плагины:
   - `better-auth`, `better-auth/next-js`
   - `@better-auth/passkey`
   - `better-auth/plugins` (2FA, если нужно)
2. Создать `getBaseUrl()` и использовать в:
   - серверной конфигурации Better Auth
   - клиентской конфигурации Better Auth
   - WebAuthn config (ORIGIN, RP ID)
3. Подключить `nextCookies()` последним плагином.
4. Добавить middleware:
   - защищает routes
   - проверяет `__Secure-` и обычные cookies
5. На странице логина добавить Passkey‑кнопку:
   - `type="button"`
   - `authClient.signIn.passkey()`
   - ожидание `authClient.getSession()`
6. В protected layout проверять `getCurrentUser()`:
   - нет пользователя → `redirect('/login')`
7. В Google OAuth:
   - redirect URI должен совпадать с каноническим доменом.

---

## Типичные ловушки и ошибки

- **Неверный RP ID** → Passkey ломается с ошибкой `invalid RP ID`.
- **Смешение `www` и apex** → потеря cookies и `state not found`.
- **Middleware проверяет только non‑secure cookie** → редирект‑петля.
- **Passkey кнопка внутри формы без `type="button"`** → сабмит формы ломает редирект.
- **Нет ожидания сессии** → ложный успех без перехода на `/dashboard`.

---

## Взаимодействие модулей

- `components/passkey/passkey-login.tsx` вызывает `authClient.signIn.passkey()`.
- Better Auth ставит cookie через `nextCookies`.
- `proxy.ts` проверяет cookie и пускает на `/dashboard`.
- `app/(protected)/layout.tsx` валидирует сессию через `getCurrentUser()`.

---

## Тест‑план

1. Email/password:
   - вход → `/dashboard` доступен
   - выход → редирект на `/login`
2. Google OAuth:
   - вход → `/dashboard`
   - повторный вход после logout
3. Passkey:
   - вход сразу после загрузки `/login`
   - logout → повторный вход → редирект на `/dashboard`
