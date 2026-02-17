# 🗄 Database Schema - PostgreSQL 17

> **Офіційна схема Better Auth 1.3.34+ з плагінами Passkey та 2FA**

**Версія:** 2.0.0
**Останнє оновлення:** 10 листопада 2025
**PostgreSQL:** 17
**Better Auth:** 1.3.34+

---

## 📋 Зміст

1. [Повна схема SQL](#повна-схема-sql)
2. [Опис таблиць](#опис-таблиць)
3. [Індекси та Foreign Keys](#індекси-та-foreign-keys)
4. [Установка схеми](#установка-схеми)
5. [Діагностика](#діагностика)

---

## 🎯 Повна схема SQL

### Файл: `sql/auth.sql`

```sql
-- ============================================================
-- PostgreSQL 17 — ОФІЦІЙНА Better Auth Schema
-- ============================================================
-- Еталонна схема згідно офіційної документації Better Auth
-- https://better-auth.com/docs
--
-- Включає:
-- - Core Authentication (user, session, account, verification)
-- - Two-Factor Authentication Plugin (twoFactor)
-- - Passkey Plugin (passkey)
--
-- Використання: psql "$DATABASE_URL" -f sql/auth.sql
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- =========================
-- Функція для auto-update updated_at
-- =========================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CORE AUTHENTICATION TABLES
-- ============================================================

-- =========================
-- 1) USER (ОФІЦІЙНА Better Auth таблиця)
-- =========================
-- ✅ ОФІЦІЙНА СХЕМА згідно Better Auth
-- Основна таблиця користувачів системи
CREATE TABLE IF NOT EXISTS "user" (
  id             text PRIMARY KEY,
  name           text NOT NULL,
  email          citext NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image          text,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),

  -- Better Auth 2FA Plugin field
  "twoFactorEnabled" boolean NOT NULL DEFAULT false,

  -- Custom fields (optional)
  "isBanned"     boolean NOT NULL DEFAULT false,
  role           text NOT NULL DEFAULT 'user'
);

CREATE INDEX IF NOT EXISTS user_email_idx ON "user"(email);

CREATE TRIGGER user_set_updated_at
BEFORE UPDATE ON "user"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- 2) SESSION (ОФІЦІЙНА Better Auth таблиця)
-- =========================
-- ✅ ОФІЦІЙНА СХЕМА згідно Better Auth
-- Активні сесії користувачів (HTTP-only cookies)
CREATE TABLE IF NOT EXISTS session (
  id             text PRIMARY KEY,
  token          text NOT NULL UNIQUE,
  "userId"       text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "ipAddress"    text,
  "userAgent"    text,
  "expiresAt"    timestamptz NOT NULL,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_token_idx ON session(token);
CREATE INDEX IF NOT EXISTS session_user_id_idx ON session("userId");

CREATE TRIGGER session_set_updated_at
BEFORE UPDATE ON session
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- 3) ACCOUNT (ОФІЦІЙНА Better Auth таблиця)
-- =========================
-- ✅ ОФІЦІЙНА СХЕМА згідно Better Auth
-- Зв'язок користувача з провайдерами (credential, google, github)
CREATE TABLE IF NOT EXISTS account (
  id             text PRIMARY KEY,
  "userId"       text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accountId"    text NOT NULL,
  "providerId"   text NOT NULL,
  "accessToken"  text,
  "refreshToken" text,
  "expiresAt"    timestamptz,
  password       text,             -- Тільки для providerId='credential'
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT account_provider_unique UNIQUE ("userId", "providerId")
);

CREATE INDEX IF NOT EXISTS account_user_id_idx ON account("userId");

CREATE TRIGGER account_set_updated_at
BEFORE UPDATE ON account
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- 4) VERIFICATION (ОФІЦІЙНА Better Auth таблиця)
-- =========================
-- ✅ ОФІЦІЙНА СХЕМА згідно Better Auth
-- Токени для верифікації email та скидання паролю
CREATE TABLE IF NOT EXISTS verification (
  id          text PRIMARY KEY,
  identifier  text NOT NULL,      -- email користувача
  value       text NOT NULL,      -- токен
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);

CREATE TRIGGER verification_set_updated_at
BEFORE UPDATE ON verification
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TWO-FACTOR AUTHENTICATION (2FA) TABLES
-- ============================================================

-- =========================
-- 5) TWO_FACTOR (ОФІЦІЙНА Better Auth таблиця)
-- =========================
-- ✅ ОФІЦІЙНА СХЕМА згідно Better Auth 2FA Plugin
-- Зберігає TOTP secret та backup codes (JSON string)
CREATE TABLE IF NOT EXISTS "twoFactor" (
  id             text PRIMARY KEY,
  secret         text NOT NULL,
  "backupCodes"  text NOT NULL, -- ✅ Backup codes зберігаються тут як JSON string
  "userId"       text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT two_factor_user_unique UNIQUE ("userId")
);

CREATE INDEX IF NOT EXISTS two_factor_user_id_idx ON "twoFactor"("userId");

CREATE TRIGGER two_factor_set_updated_at
BEFORE UPDATE ON "twoFactor"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- PASSKEY PLUGIN
-- ============================================================

-- =========================
-- 6) PASSKEY (ОФІЦІЙНА Better Auth таблиця)
-- =========================
-- ✅ ОФІЦІЙНА СХЕМА згідно Better Auth Passkey Plugin
-- Хранение WebAuthn credentials для passwordless authentication
-- Каждый passkey привязан к устройству пользователя
CREATE TABLE IF NOT EXISTS passkey (
  id             text PRIMARY KEY,
  name           text,                    -- Название устройства (например, "iPhone 15 Pro")
  "publicKey"    text NOT NULL,           -- Публичный ключ credential
  "userId"       text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "credentialID" text NOT NULL,           -- Уникальный ID credential
  counter        bigint NOT NULL DEFAULT 0, -- Счетчик использования (защита от replay)
  "deviceType"   text,                    -- Тип устройства (multiDevice, singleDevice)
  "backedUp"     boolean NOT NULL DEFAULT false, -- Синхронизировано в облаке
  transports     text,                    -- JSON массив транспортов (usb, nfc, ble, internal)
  aaguid         text,                    -- Authenticator Attestation GUID (идентификатор типа аутентификатора)
  "createdAt"    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT passkey_credential_unique UNIQUE ("credentialID")
);

CREATE INDEX IF NOT EXISTS passkey_user_id_idx ON passkey("userId");

-- ============================================================
-- SCHEMA VERSION INFO
-- ============================================================
-- Better Auth v1.3.34+
-- Plugins: twoFactor (2FA/TOTP), passkey (WebAuthn)
-- PostgreSQL 17 з розширенням citext
--
-- Всі таблиці та поля відповідають офіційній специфікації Better Auth
-- Жодних кастомних таблиць або костилів
-- ============================================================
-- END OF SCHEMA
-- ============================================================
```

---

## 📊 Опис таблиць

### 1. `user` - Користувачі

Основна таблиця користувачів системи.

| Поле               | Тип         | Опис                                                             |
| ------------------ | ----------- | ---------------------------------------------------------------- |
| `id`               | text        | UUID користувача (PK)                                            |
| `name`             | text        | Ім'я користувача (авто-генерується: `user_<timestamp>_<random>`) |
| `email`            | citext      | Email (case-insensitive, unique)                                 |
| `emailVerified`    | boolean     | Чи підтверджено email                                            |
| `image`            | text        | URL аватара (опційно)                                            |
| `twoFactorEnabled` | boolean     | Чи увімкнено 2FA                                                 |
| `isBanned`         | boolean     | Чи заблоковано користувача (custom)                              |
| `role`             | text        | Роль: `user` / `admin` (custom)                                  |
| `createdAt`        | timestamptz | Дата створення                                                   |
| `updatedAt`        | timestamptz | Дата оновлення (auto-update)                                     |

**Індекси:**

- `user_email_idx` на `email` (UNIQUE)

**Triggers:**

- `user_set_updated_at` - автоматичне оновлення `updatedAt`

---

### 2. `session` - Сесії

Активні сесії користувачів (HTTP-only cookies).

| Поле        | Тип         | Опис                                     |
| ----------- | ----------- | ---------------------------------------- |
| `id`        | text        | UUID сесії (PK)                          |
| `token`     | text        | Session token (unique, stored in cookie) |
| `userId`    | text        | FK на `user.id` (CASCADE DELETE)         |
| `ipAddress` | text        | IP адреса користувача                    |
| `userAgent` | text        | User-Agent браузера                      |
| `expiresAt` | timestamptz | Час закінчення сесії (7 днів)            |
| `createdAt` | timestamptz | Дата створення                           |
| `updatedAt` | timestamptz | Дата оновлення                           |

**Індекси:**

- `session_token_idx` на `token` (UNIQUE)
- `session_user_id_idx` на `userId`

**Triggers:**

- `session_set_updated_at`

---

### 3. `account` - Провайдери автентифікації

Зв'язок користувача з різними провайдерами (credential, google, github).

| Поле           | Тип         | Опис                                           |
| -------------- | ----------- | ---------------------------------------------- |
| `id`           | text        | UUID account (PK)                              |
| `userId`       | text        | FK на `user.id` (CASCADE DELETE)               |
| `accountId`    | text        | ID в провайдері (email для credential)         |
| `providerId`   | text        | `credential` / `google` / `github`             |
| `accessToken`  | text        | OAuth access token (для OAuth)                 |
| `refreshToken` | text        | OAuth refresh token (для OAuth)                |
| `expiresAt`    | timestamptz | Час закінчення токена                          |
| `password`     | text        | Хеш паролю (`scrypt`, тільки для `credential`) |
| `createdAt`    | timestamptz | Дата створення                                 |
| `updatedAt`    | timestamptz | Дата оновлення                                 |

**Constraints:**

- `account_provider_unique` - UNIQUE на (`userId`, `providerId`)

**Індекси:**

- `account_user_id_idx` на `userId`

**Triggers:**

- `account_set_updated_at`

---

### 4. `verification` - Токени верифікації

Токени для верифікації email та скидання паролю.

| Поле         | Тип         | Опис                                   |
| ------------ | ----------- | -------------------------------------- |
| `id`         | text        | UUID токена (PK)                       |
| `identifier` | text        | Email користувача                      |
| `value`      | text        | Токен (UUID)                           |
| `expiresAt`  | timestamptz | Час закінчення (email: 24h, reset: 1h) |
| `createdAt`  | timestamptz | Дата створення                         |
| `updatedAt`  | timestamptz | Дата оновлення                         |

**Індекси:**

- `verification_identifier_idx` на `identifier`

**Triggers:**

- `verification_set_updated_at`

---

### 5. `twoFactor` - 2FA (TOTP)

Зберігає TOTP secret та backup codes для двофакторної автентифікації.

| Поле          | Тип         | Опис                                     |
| ------------- | ----------- | ---------------------------------------- |
| `id`          | text        | UUID (PK)                                |
| `secret`      | text        | TOTP secret (base32)                     |
| `backupCodes` | text        | JSON string з масивом backup кодів       |
| `userId`      | text        | FK на `user.id` (CASCADE DELETE, UNIQUE) |
| `createdAt`   | timestamptz | Дата створення                           |
| `updatedAt`   | timestamptz | Дата оновлення                           |

**Constraints:**

- `two_factor_user_unique` - UNIQUE на `userId` (1 запис на користувача)

**Індекси:**

- `two_factor_user_id_idx` на `userId`

**Формат `backupCodes`:**

```json
["ABCD1234", "EFGH5678", "IJKL9012", ...]
```

**Triggers:**

- `two_factor_set_updated_at`

---

### 6. `passkey` - Passkey (WebAuthn)

Зберігає WebAuthn credentials для passwordless автентифікації.

| Поле           | Тип         | Опис                                             |
| -------------- | ----------- | ------------------------------------------------ |
| `id`           | text        | UUID (PK)                                        |
| `name`         | text        | Назва пристрою ("iPhone 15 Pro", "MacBook Pro")  |
| `publicKey`    | text        | Публічний ключ credential (base64)               |
| `userId`       | text        | FK на `user.id` (CASCADE DELETE)                 |
| `credentialID` | text        | Унікальний ID credential (UNIQUE)                |
| `counter`      | bigint      | Лічильник використань (захист від replay)        |
| `deviceType`   | text        | `multiDevice` / `singleDevice` / null            |
| `backedUp`     | boolean     | Чи синхронізовано в хмарі (iCloud, Google)       |
| `transports`   | text        | JSON string: `["internal", "usb", "nfc", "ble"]` |
| `aaguid`       | text        | Authenticator Attestation GUID                   |
| `createdAt`    | timestamptz | Дата створення                                   |

**Constraints:**

- `passkey_credential_unique` - UNIQUE на `credentialID`

**Індекси:**

- `passkey_user_id_idx` на `userId`

**Значення `deviceType`:**

- `multiDevice` - Touch ID, Face ID, Windows Hello (синхронізуються)
- `singleDevice` - USB Security Keys, NFC (не синхронізуються)
- `null` - Невідомо

---

## 🔗 Індекси та Foreign Keys

### Foreign Keys (CASCADE DELETE)

```
session.userId       → user.id
account.userId       → user.id
twoFactor.userId     → user.id
passkey.userId       → user.id
```

**Поведінка:** При видаленні користувача автоматично видаляються:

- Всі його сесії
- Всі його accounts
- Його 2FA налаштування
- Всі його passkeys

### Індекси для продуктивності

```sql
-- USER
CREATE INDEX user_email_idx ON "user"(email);

-- SESSION
CREATE INDEX session_token_idx ON session(token);
CREATE INDEX session_user_id_idx ON session("userId");

-- ACCOUNT
CREATE INDEX account_user_id_idx ON account("userId");

-- VERIFICATION
CREATE INDEX verification_identifier_idx ON verification(identifier);

-- TWO_FACTOR
CREATE INDEX two_factor_user_id_idx ON "twoFactor"("userId");

-- PASSKEY
CREATE INDEX passkey_user_id_idx ON passkey("userId");
```

---

## 🚀 Установка схеми

### Крок 1: Підготовка

Переконайтеся що у вас є:

- PostgreSQL 17
- Database URL в `.env.local`

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### Крок 2: Застосування схеми

```bash
# З локального файлу
psql "$DATABASE_URL" -f sql/auth.sql

# Або напряму
cat sql/auth.sql | psql "$DATABASE_URL"
```

### Крок 3: Перевірка

```sql
-- Перевірка таблиць
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Очікувані таблиці:
-- user
-- session
-- account
-- verification
-- twoFactor
-- passkey
```

---

## 🔧 Діагностика

### Файл: `temp/sql-debug/debug-auth.sql`

```sql
-- ============================================================
-- ДІАГНОСТИКА АВТЕНТИФІКАЦІЇ
-- ============================================================

-- 0. ШВИДКА ПЕРЕВІРКА КОНКРЕТНОГО КОРИСТУВАЧА
SELECT
  u.id as user_id,
  u.email,
  u.name,
  u."emailVerified",
  u."twoFactorEnabled",
  u."isBanned",
  u.role,
  -- Account info
  a.id as account_id,
  a."providerId" as provider,
  CASE
    WHEN a.password IS NULL THEN '❌ NO PASSWORD'
    WHEN LENGTH(a.password) > 50 THEN '✅ Hashed (' || LENGTH(a.password) || ' chars)'
    ELSE '⚠️ TOO SHORT (' || LENGTH(a.password) || ' chars: ' || LEFT(a.password, 20) || '...)'
  END as password_status,
  LEFT(a.password, 30) || '...' as password_preview,
  -- Timestamps
  u."createdAt",
  u."updatedAt"
FROM "user" u
LEFT JOIN account a ON u.id = a."userId"
-- WHERE u.email = 'your-email@example.com' -- РОЗКОМЕНТУЙТЕ і вставте свій email
ORDER BY u."createdAt" DESC
LIMIT 5;

-- 1. Загальна статистика користувачів
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE "emailVerified" = true) as verified_users,
  COUNT(*) FILTER (WHERE "twoFactorEnabled" = true) as users_with_2fa,
  COUNT(*) FILTER (WHERE "isBanned" = true) as banned_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users
FROM "user";

-- 2. Перевірка accounts (credential vs OAuth)
SELECT
  a."providerId",
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE a.password IS NOT NULL) as with_password
FROM account a
GROUP BY a."providerId";

-- 3. Активні сесії
SELECT
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE "expiresAt" > NOW()) as active_sessions,
  COUNT(*) FILTER (WHERE "expiresAt" <= NOW()) as expired_sessions
FROM session;

-- 4. Перевірка 2FA
SELECT
  u.id,
  u.email,
  u."twoFactorEnabled",
  CASE
    WHEN tf.secret IS NOT NULL THEN '✅ SECRET EXISTS'
    ELSE '❌ NO SECRET'
  END as secret_status,
  tf."createdAt" as two_factor_created
FROM "user" u
LEFT JOIN "twoFactor" tf ON u.id = tf."userId"
WHERE u."twoFactorEnabled" = true
LIMIT 10;

-- 5. Перевірка verification tokens (email verification, reset password)
SELECT
  id,
  identifier as user_identifier,
  LEFT(value, 20) || '...' as token_preview,
  "expiresAt",
  "createdAt",
  CASE
    WHEN "expiresAt" > NOW() THEN '✅ VALID'
    ELSE '❌ EXPIRED'
  END as status
FROM verification
ORDER BY "createdAt" DESC
LIMIT 10;

-- 6. Перевірка Passkeys
SELECT
  p.id,
  p.name,
  p."deviceType",
  p."backedUp",
  p.counter,
  u.email as owner_email,
  p."createdAt"
FROM passkey p
JOIN "user" u ON p."userId" = u.id
ORDER BY p."createdAt" DESC
LIMIT 10;
```

### Запуск діагностики

```bash
psql "$DATABASE_URL" -f temp/sql-debug/debug-auth.sql
```

---

## 🗑 Видалення схеми (УВАГА!)

### Файл: `temp/sql-debug/auth-drop.sql`

```sql
-- ============================================================
-- Повне видалення схеми Better Auth
-- ============================================================
-- Використання: psql "$DATABASE_URL" -f temp/sql-debug/auth-drop.sql
-- УВАГА: Видаляє ВСІ дані автентифікації!
-- ============================================================

-- Видаляємо ОФІЦІЙНІ таблиці Better Auth (в правильному порядку через foreign keys)
DROP TABLE IF EXISTS passkey CASCADE;
DROP TABLE IF EXISTS "twoFactor" CASCADE;
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Видаляємо функції
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- Видаляємо розширення (опціонально, якщо більше не потрібно)
-- DROP EXTENSION IF EXISTS citext CASCADE;

-- ============================================================
-- Видалення завершено
-- ============================================================
```

**Використання:**

```bash
# УВАГА: Видаляє ВСІ дані!
psql "$DATABASE_URL" -f temp/sql-debug/auth-drop.sql

# Після цього можна заново створити схему
psql "$DATABASE_URL" -f sql/auth.sql
```

---

## 📝 Важливі примітки

### Password Hashing

Better Auth використовує **`scrypt`** для хешування паролів:

- Довжина хешу: ~97 символів
- Формат: `scrypt$<параметри>$<сіль>$<хеш>`
- НЕ bcrypt! (це важливо для діагностики)

### Session Duration

За замовчуванням: **7 днів**

```typescript
// lib/auth/auth.ts
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 днів
  updateAge: 60 * 60 * 24,     // Оновлювати кожні 24 години
}
```

### Email Case Sensitivity

Використовується розширення `citext` для `user.email`:

- `John@Example.com` === `john@example.com`
- Зберігається оригінальний регістр
- Порівняння case-insensitive

### Backup Codes Format

```json
["ABCD1234", "EFGH5678", "IJKL9012", ...]
```

- 10 кодів по 8 символів
- Uppercase, alphanumeric
- Одноразові (при використанні видаляються з масиву)
- Зберігаються як JSON string в `twoFactor.backupCodes`

---

## ✅ Чек-лист перевірки

Після створення БД перевірте:

- [ ] Всі 6 таблиць створені (`user`, `session`, `account`, `verification`, `twoFactor`, `passkey`)
- [ ] Extension `citext` встановлено
- [ ] Функція `set_updated_at()` існує
- [ ] Всі індекси створені
- [ ] Foreign keys працюють (CASCADE DELETE)
- [ ] Triggers встановлені на `updatedAt`
- [ ] Можна створити користувача
- [ ] Можна створити сесію
- [ ] Діагностичний скрипт працює

---

**Автор:** Max + Cursor AI
**Джерело:** [Better Auth Official Docs](https://better-auth.com/docs)
**Версія БД:** PostgreSQL 17

---

_Ця схема на 100% відповідає офіційній специфікації Better Auth 1.3.34+_
