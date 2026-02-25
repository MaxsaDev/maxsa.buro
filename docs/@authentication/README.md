# 🔐 Документація системи автентифікації

> **Повна документація автентифікації в maxsa.dev**

**Версія:** 2.1.0
**Останнє оновлення:** 12 листопада 2025
**Stack:** Better Auth 1.3.34+, Next.js 16, React 19, PostgreSQL 17

---

## 📖 Зміст документації

### 🚀 Швидкий старт

1. **[Better Auth Setup](./better-auth-setup.md)** - Налаштування Better Auth з нуля
2. **[Database Schema](./database-schema.md)** - Повна схема бази даних PostgreSQL

### 🔑 Методи автентифікації

3. **[Email & Password](./email-password-auth.md)** - Класична автентифікація
4. **[Two-Factor (2FA)](./two-factor-auth.md)** - TOTP з backup кодами
5. **[Passkey (WebAuthn)](./passkey-auth.md)** - Біометрична автентифікація

### 🎨 UI/UX

6. **[Form Design Patterns](../ui-ux-decisions.md)** - Принципи дизайну форм

---

## 🎯 Що реалізовано

### ✅ Core Authentication

- **Email/Password** - Реєстрація, вхід, верифікація email
- **Session Management** - HTTP-only cookies, auto-refresh
- **Password Reset** - Email-based reset flow
- **Email Verification** - Resend + domain setup

### ✅ Advanced Security

- **Two-Factor (TOTP)** - Google Authenticator, Authy
- **Backup Codes** - 10 одноразових кодів відновлення
- **Passkey (WebAuthn)** - Touch ID, Face ID, Security Keys
- **OAuth** - Google Sign-In (готово до розширення)

### ✅ User Management

- **Role-based Access** - user / admin
- **Auto-generated Usernames** - `user_<timestamp>_<random>`
- **One-time Name Change** - Баланс гібкості та стабільності
- **Profile Management** - Налаштування безпеки

---

## 🏗 Архітектура

### Tech Stack

```
Frontend:  Next.js 16 (App Router) + React 19
Backend:   Server Actions + Better Auth API
Database:  PostgreSQL 17 + node-postgres
Auth:      Better Auth 1.3.34+ (Passkey + 2FA Plugins)
UI:        Shadcn UI + TailwindCSS 4.x
Validation: Zod + React Hook Form
Email:     Resend
```

### Плагіни Better Auth

```typescript
import { passkey } from 'better-auth/plugins/passkey';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { nextCookies } from 'better-auth/next-js';

plugins: [
  passkey({
    rpName: 'Maxsa Buro',
    rpID: 'localhost', // production: maxsa.dev
    origin: 'http://localhost:3000',
  }),
  twoFactor({
    issuer: 'Maxsa Buro',
  }),
  nextCookies(), // ВАЖЛИВО: має бути останнім!
];
```

---

## 📊 Структура файлів

### Server-side

```
lib/
├── auth.ts              # Better Auth configuration
├── auth-server.ts       # Server utilities (getCurrentUser)
├── auth-client.ts       # Client utilities (authClient)
├── db.ts                # PostgreSQL connection pool
└── const.ts             # WebAuthn config

actions/
├── auth/
│   ├── login.ts         # Login + 2FA check
│   ├── register.ts      # Registration
│   ├── logout.ts        # Logout
│   └── reset-password.ts
└── passkey/
    ├── list-passkeys.ts
    ├── rename-passkey.ts
    └── delete-passkey.ts
```

### Client-side

```
components/
├── auth/
│   ├── login-form.tsx          # Вхід (email/password/2FA)
│   ├── signup-form.tsx         # Реєстрація
│   ├── forgot-password-form.tsx # Запит на скидання паролю
│   ├── reset-password-form.tsx # Встановлення нового паролю
│   ├── verify-email.tsx        # Підтвердження email
│   └── submit-button.tsx       # Кнопка відправки форми
├── passkey/
│   ├── passkey-login.tsx       # Вхід через Passkey
│   ├── passkey-setup.tsx       # Додавання Passkey
│   └── passkey-list.tsx        # Список Passkeys
└── profile/
    └── two-factor-setup.tsx    # Налаштування 2FA
```

### Структура сторінок

```
app/(auth)/
├── login/
│   └── page.tsx              # Сторінка входу (використовує LoginForm)
├── register/
│   └── page.tsx              # Сторінка реєстрації (використовує SignupForm)
├── forgot-password/
│   └── page.tsx              # Сторінка запиту скидання паролю (використовує ForgotPasswordForm)
├── reset-password/
│   └── page.tsx              # Сторінка встановлення нового паролю (використовує ResetPasswordForm)
└── verify-email/
    └── page.tsx              # Сторінка підтвердження email (використовує VerifyEmail)
```

**Архітектурний принцип:** Всі форми винесені в окремі компоненти в `components/auth/`, а сторінки містять тільки логотип, обгортку та імпорт компонента форми. Це забезпечує:

- Розділення відповідальності (separation of concerns)
- Перевикористання компонентів
- Легше тестування
- Консистентну структуру коду

---

## 🔐 Security Features

### Session Management

- **HTTP-only Cookies** - Захист від XSS
- **Secure Flag** - HTTPS only в production
- **SameSite: Lax** - Захист від CSRF
- **Auto-refresh** - Безшовне оновлення сесії
- **Session Duration** - 7 днів

### Password Security

- **Hashing Algorithm** - `scrypt` (Better Auth default)
- **Minimum Length** - 8 символів
- **Complexity** - Без специфічних вимог (користувач вирішує)
- **Reset Tokens** - 1 година дії

### 2FA Security

- **TOTP Algorithm** - RFC 6238 (30 sec intervals)
- **Backup Codes** - 8 символів, uppercase, одноразові
- **Secret Storage** - Шифрується в БД
- **QR Code** - Генерується динамічно, не зберігається

### Passkey Security

- **WebAuthn Level 2** - Phishing-resistant
- **Attestation** - None (privacy-friendly)
- **User Verification** - Required (біометрія)
- **Credential Storage** - Тільки публічний ключ в БД

---

## 🚀 Як користуватися документацією

### Для нового проекту

1. Почніть з **[Better Auth Setup](./better-auth-setup.md)**
2. Створіть БД через **[Database Schema](./database-schema.md)**
3. Реалізуйте **[Email/Password](./email-password-auth.md)**
4. Додайте **[2FA](./two-factor-auth.md)** (опційно)
5. Додайте **[Passkey](./passkey-auth.md)** (опційно)

### Для існуючого проекту

- Кожен розділ містить **повний робочий код**
- Копіюйте та адаптуйте під свої потреби
- Всі приклади протестовані та працюють

### Для вивчення

- Читайте по порядку від простого до складного
- Кожен розділ самодостатній
- Технічні деталі та обгрунтування рішень

---

## 📚 Додаткові ресурси

### Офіційна документація

- [Better Auth Docs](https://better-auth.com/docs)
- [Better Auth Passkey Plugin](https://better-auth.com/docs/plugins/passkey)
- [Better Auth 2FA Plugin](https://better-auth.com/docs/plugins/two-factor)
- [WebAuthn Guide](https://webauthn.guide/)
- [Next.js 16 Docs](https://nextjs.org/docs)

### Інші розділи документації

- **[UI/UX Decisions](../ui-ux-decisions.md)** - Принципи дизайну форм
- **[Project Roadmap](../roadmap.md)** - Стан проекту та плани
- **[ESLint & Prettier](../@eslint-prettier/)** - Налаштування лінтерів

---

## 🎯 Навігація за сценаріями

### Сценарій 1: Базова автентифікація

```
1. Better Auth Setup
2. Database Schema
3. Email & Password Auth
```

→ **Час:** ~2 години
→ **Результат:** Повнофункціональна реєстрація/вхід

### Сценарій 2: + Двофакторна автентифікація

```
Базова автентифікація + Two-Factor Auth
```

→ **Час:** +1 година
→ **Результат:** TOTP з backup кодами

### Сценарій 3: + Passkey (Біометрія)

```
Базова автентифікація + Passkey Auth
```

→ **Час:** +1 година
→ **Результат:** Touch ID / Face ID вхід

### Сценарій 4: Повний стек (All-in)

```
Email/Password + 2FA + Passkey
```

→ **Час:** ~4 години
→ **Результат:** Enterprise-grade автентифікація

---

## ✅ Чек-лист перевірки

Після реалізації перевірте:

- [ ] Better Auth налаштовано та працює
- [ ] БД створена через `sql/auth.sql`
- [ ] Реєстрація працює + email verification
- [ ] Вхід працює з правильним email/паролем
- [ ] Скидання паролю працює через email
- [ ] Сесія зберігається після перезавантаження
- [ ] 2FA можна увімкнути/вимкнути (якщо потрібно)
- [ ] Passkey можна додати/видалити (якщо потрібно)
- [ ] Всі Server Actions мають валідацію Zod
- [ ] Всі форми мають правильний UX (ui-ux-decisions.md)
- [ ] Linter не показує помилок (`npm run lint`)
- [ ] Build проходить (`npm run build`)

---

## 🐛 Troubleshooting

### Проблеми з Better Auth

→ Читайте: [Better Auth Setup](./better-auth-setup.md) розділ "Troubleshooting"

### Проблеми з БД

→ Читайте: [Database Schema](./database-schema.md) розділ "Діагностика"

### Проблеми з 2FA

→ Читайте: [Two-Factor Auth](./two-factor-auth.md) розділ "Troubleshooting"

### Проблеми з Passkey

→ Читайте: [Passkey Auth](./passkey-auth.md) розділ "Troubleshooting"

---

## 📝 Зворотний зв'язок

Знайшли помилку або маєте пропозицію?

1. Створіть Issue в репозиторії
2. Опишіть проблему детально
3. Додайте скріншоти (якщо UI)
4. Вкажіть версію Better Auth

---

**Автор:** Max + Cursor AI
**Проект:** maxsa.dev
**Ліцензія:** Private (для внутрішнього використання)

---

_Ця документація описує ТІЛЬКИ робоче рішення без історії помилок та міграцій._
