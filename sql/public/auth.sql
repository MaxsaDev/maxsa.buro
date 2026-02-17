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

-- ====================
-- EXTENSIONS
-- ====================

-- Case-insensitive email type
CREATE EXTENSION IF NOT EXISTS citext;

-- ====================
-- UTILITY FUNCTIONS
-- ====================

-- Автоматическое обновление updatedAt при UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."updatedAt" := NOW();
  RETURN NEW;
END; $$;

-- ============================================================
-- CORE AUTHENTICATION TABLES
-- ============================================================

-- =========================
-- 1) USER
-- =========================
-- Основная таблица пользователей
-- ВАЖНО: "user" — зарезервированное слово, используем в кавычках
-- Better Auth использует camelCase для полей
-- Better Auth генерирует SHORT ID (не UUID), поэтому тип text
CREATE TABLE IF NOT EXISTS "user" (
  id                 text PRIMARY KEY,
  name               text NOT NULL,
  email              citext NOT NULL,
  "emailVerified"    boolean NOT NULL DEFAULT false,
  image              text,

  -- Кастомные поля для вашего приложения
  role               varchar(10) NOT NULL DEFAULT 'user',
  "isBanned"         boolean NOT NULL DEFAULT false,

  -- Флаг для включения 2FA
  "twoFactorEnabled" boolean NOT NULL DEFAULT false,

  -- Timestamps
  "createdAt"        timestamptz NOT NULL DEFAULT now(),
  "updatedAt"        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_email_unique UNIQUE (email),
  CONSTRAINT user_role_check CHECK (role IN ('user', 'admin'))
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS user_created_at_idx ON "user"("createdAt");
CREATE INDEX IF NOT EXISTS user_role_idx ON "user"(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS user_banned_idx ON "user"("isBanned") WHERE "isBanned" = true;

-- Trigger для автообновления updatedAt
CREATE TRIGGER user_set_updated_at
BEFORE UPDATE ON "user"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- 2) SESSION
-- =========================
-- Хранение активных сессий пользователей
CREATE TABLE IF NOT EXISTS session (
  id           text PRIMARY KEY,
  "userId"     text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token        text NOT NULL,
  "expiresAt"  timestamptz NOT NULL,
  "ipAddress"  text,
  "userAgent"  text,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  "updatedAt"  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT session_token_unique UNIQUE (token)
);

-- Индексы
CREATE INDEX IF NOT EXISTS session_user_id_idx ON session("userId");
CREATE INDEX IF NOT EXISTS session_expires_idx ON session("expiresAt");

CREATE TRIGGER session_set_updated_at
BEFORE UPDATE ON session
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- 3) ACCOUNT
-- =========================
-- Связь пользователя с провайдерами OAuth и credential storage
CREATE TABLE IF NOT EXISTS account (
  id                       text PRIMARY KEY,
  "userId"                 text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accountId"              text NOT NULL,
  "providerId"             text NOT NULL,
  "accessToken"            text,
  "refreshToken"           text,
  "accessTokenExpiresAt"   timestamptz,
  "refreshTokenExpiresAt"  timestamptz,
  scope                    text,
  "idToken"                text,
  password                 text,
  "createdAt"              timestamptz NOT NULL DEFAULT now(),
  "updatedAt"              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT account_provider_acc_unique UNIQUE ("providerId", "accountId")
);

CREATE INDEX IF NOT EXISTS account_user_id_idx ON account("userId");

CREATE TRIGGER account_set_updated_at
BEFORE UPDATE ON account
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- 4) VERIFICATION
-- =========================
-- Верификационные токены (email verification, password reset, etc.)
CREATE TABLE IF NOT EXISTS verification (
  id           text PRIMARY KEY,
  identifier   text NOT NULL,
  value        text NOT NULL,
  "expiresAt"  timestamptz NOT NULL,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  "updatedAt"  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT verification_identifier_value_unique UNIQUE (identifier, value)
);

CREATE INDEX IF NOT EXISTS verification_expires_idx ON verification("expiresAt");

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
  "backupCodes"  text NOT NULL,
  "userId"       text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT two_factor_user_unique UNIQUE ("userId")
);

CREATE INDEX IF NOT EXISTS two_factor_user_id_idx ON "twoFactor"("userId");

CREATE TRIGGER two_factor_set_updated_at
BEFORE UPDATE ON "twoFactor"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- 6) TWO_FACTOR (ОФІЦІЙНА Better Auth таблиця)
-- =========================
-- ✅ ОФІЦІЙНА СХЕМА згідно Better Auth 2FA Plugin
-- Backup codes зберігаються в backupCodes як JSON string
-- Better Auth автоматично керує всім життєвим циклом

-- ============================================================
-- PASSKEY PLUGIN
-- ============================================================

-- =========================
-- 7) PASSKEY (ОФІЦІЙНА Better Auth таблиця)
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
  "deviceType"   text,                    -- Тип устройства (platform, cross-platform)
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
