-- ============================================================
-- СТВОРЕННЯ БД ДЛЯ НОВОГО ПРОЄКТУ (повний стан)
-- Порядок: розширення → схеми → таблиці → функції → тригери → представлення
-- ============================================================

-- ============================================================
-- РОЗШИРЕННЯ
-- ============================================================
CREATE EXTENSION IF NOT EXISTS citext;        -- case-insensitive текст
CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()

-- ============================================================
-- СХЕМИ
-- ============================================================
CREATE SCHEMA IF NOT EXISTS mx_global;
CREATE SCHEMA IF NOT EXISTS mx_dic;
CREATE SCHEMA IF NOT EXISTS mx_system;
CREATE SCHEMA IF NOT EXISTS mx_data;

-- ============================================================
-- ГЛОБАЛЬНІ ФУНКЦІЇ
-- ============================================================
CREATE OR REPLACE FUNCTION mx_global.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$;

-- ============================================================
-- PUBLIC: BETTER AUTH (ОФІЦІЙНА СХЕМА)
-- ============================================================

-- Функція для auto-update updatedAt (Better Auth використовує camelCase)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."updatedAt" := NOW();
  RETURN NEW;
END; $$;

-- 1) USER
CREATE TABLE IF NOT EXISTS "user" (
  id                 text PRIMARY KEY,
  name               text NOT NULL,
  email              citext NOT NULL,
  "emailVerified"    boolean NOT NULL DEFAULT false,
  image              text,

  -- Кастомні поля
  role               varchar(10) NOT NULL DEFAULT 'user',
  "isBanned"         boolean NOT NULL DEFAULT false,
  "twoFactorEnabled" boolean NOT NULL DEFAULT false,

  -- Timestamps
  "createdAt"        timestamptz NOT NULL DEFAULT now(),
  "updatedAt"        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_email_unique UNIQUE (email),
  CONSTRAINT user_role_check CHECK (role IN ('user', 'admin'))
);

CREATE INDEX IF NOT EXISTS user_created_at_idx ON "user"("createdAt");
CREATE INDEX IF NOT EXISTS user_role_idx ON "user"(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS user_banned_idx ON "user"("isBanned") WHERE "isBanned" = true;

DROP TRIGGER IF EXISTS user_set_updated_at ON "user";
CREATE TRIGGER user_set_updated_at
BEFORE UPDATE ON "user"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2) SESSION
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

CREATE INDEX IF NOT EXISTS session_user_id_idx ON session("userId");
CREATE INDEX IF NOT EXISTS session_expires_idx ON session("expiresAt");

DROP TRIGGER IF EXISTS session_set_updated_at ON session;
CREATE TRIGGER session_set_updated_at
BEFORE UPDATE ON session
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3) ACCOUNT
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

DROP TRIGGER IF EXISTS account_set_updated_at ON account;
CREATE TRIGGER account_set_updated_at
BEFORE UPDATE ON account
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4) VERIFICATION
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

DROP TRIGGER IF EXISTS verification_set_updated_at ON verification;
CREATE TRIGGER verification_set_updated_at
BEFORE UPDATE ON verification
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5) TWO_FACTOR
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

DROP TRIGGER IF EXISTS two_factor_set_updated_at ON "twoFactor";
CREATE TRIGGER two_factor_set_updated_at
BEFORE UPDATE ON "twoFactor"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6) PASSKEY
CREATE TABLE IF NOT EXISTS passkey (
  id             text PRIMARY KEY,
  name           text,
  "publicKey"    text NOT NULL,
  "userId"       text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "credentialID" text NOT NULL,
  counter        bigint NOT NULL DEFAULT 0,
  "deviceType"   text,
  "backedUp"     boolean NOT NULL DEFAULT false,
  transports     text,
  aaguid         text,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT passkey_credential_unique UNIQUE ("credentialID")
);

CREATE INDEX IF NOT EXISTS passkey_user_id_idx ON passkey("userId");

-- ============================================================
-- MX_DIC: ДОВІДНИКИ ТА МЕНЮ
-- ============================================================

-- Словник типів контактів
CREATE TABLE IF NOT EXISTS mx_dic.dic_contact_type (
  id          smallserial PRIMARY KEY,           -- компактний FK
  code        text NOT NULL UNIQUE,              -- машинний код
  title       text NOT NULL,                     -- локалізована назва
  url_prefix  text,                              -- префікс URL
  title_en    text,                              -- англійська назва
  icon        text,                              -- іконка/URL
  sort_order  int  NOT NULL DEFAULT 100,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE mx_dic.dic_contact_type IS
'Словник каналів зв’язку з метаданими (назва, іконка, URL-префікс, активність).';

INSERT INTO mx_dic.dic_contact_type (code, title, title_en, url_prefix, sort_order) VALUES
 ('phone',     'Телефон',              'Phone',     'tel:',                   10),
 ('email',     'Електронна пошта',     'Email',     'mailto:',                20),
 ('telegram',  'Telegram',             'Telegram',  'https://t.me/',          30),
 ('viber',     'Viber',                'Viber',     'viber://add?number=',    40),
 ('whatsapp',  'WhatsApp',             'WhatsApp',  'https://wa.me/',         50),
 ('facebook',  'Facebook',             'Facebook',  'https://facebook.com/',  60),
 ('messenger', 'Messenger',            'Messenger', 'https://m.me/',          65),
 ('instagram', 'Instagram',            'Instagram', 'https://instagram.com/', 70)
ON CONFLICT (code) DO NOTHING;

DROP TRIGGER IF EXISTS trg_dic_contact_type_bu_set_updated_at ON mx_dic.dic_contact_type;
CREATE TRIGGER trg_dic_contact_type_bu_set_updated_at
BEFORE UPDATE ON mx_dic.dic_contact_type
FOR EACH ROW
EXECUTE FUNCTION mx_global.set_updated_at();

-- Словник типів меню
CREATE TABLE IF NOT EXISTS mx_dic.menu_types (
  id          smallserial PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  title       text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 100,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE mx_dic.menu_types IS
'Словник типів меню: sections (з секціями та пунктами), items (тільки пункти), general (загальне — без офісу).';

INSERT INTO mx_dic.menu_types (code, title, sort_order) VALUES
 ('sections', 'Меню з секціями та пунктами', 10),
 ('items',    'Меню з пунктами',              20),
 ('general',  'Загальне меню (без офісу)',    30)
ON CONFLICT (code) DO NOTHING;

-- Меню
CREATE TABLE IF NOT EXISTS mx_dic.menus (
  id           SERIAL PRIMARY KEY,
  title        text        NOT NULL,
  menu_type_id smallint    NOT NULL,
  sort_order   int         NOT NULL DEFAULT 100,
  is_active    boolean     NOT NULL DEFAULT TRUE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT menus_fk_menu_type
    FOREIGN KEY (menu_type_id)
    REFERENCES mx_dic.menu_types(id)
    ON DELETE RESTRICT
);

COMMENT ON TABLE mx_dic.menus IS
'Меню приложения. Адміністратор може створювати кілька меню різних типів та ранжувати їх.';

CREATE INDEX IF NOT EXISTS idx_menus_sort_order ON mx_dic.menus(sort_order);
CREATE INDEX IF NOT EXISTS idx_menus_menu_type_id ON mx_dic.menus(menu_type_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON mx_dic.menus(is_active);

-- Базовий запис меню типу 'general'
INSERT INTO mx_dic.menus (title, menu_type_id, sort_order, is_active)
SELECT 'Загальне меню', mt.id, 50, TRUE
FROM mx_dic.menu_types mt
WHERE mt.code = 'general'
  AND NOT EXISTS (
    SELECT 1 FROM mx_dic.menus m WHERE m.menu_type_id = mt.id
  );

-- Категорії меню з секціями
CREATE TABLE IF NOT EXISTS mx_dic.menu_user_sections_category
(
  id         SERIAL PRIMARY KEY,
  menu_id    int         NOT NULL,
  title      text        NOT NULL,
  url        text        NOT NULL,
  icon       text        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT TRUE,

  CONSTRAINT menu_user_sections_category_fk_menu
    FOREIGN KEY (menu_id)
    REFERENCES mx_dic.menus(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_user_sections_category_menu_id
  ON mx_dic.menu_user_sections_category(menu_id);

-- Пункти меню з секціями
CREATE TABLE IF NOT EXISTS mx_dic.menu_user_sections_items
(
  id          SERIAL      PRIMARY KEY,
  category_id int         NOT NULL,
  title       text        NOT NULL,
  icon        text        NOT NULL,
  url         text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 100,
  is_active   boolean     NOT NULL DEFAULT TRUE,
  is_default  boolean     NOT NULL DEFAULT FALSE,

  CONSTRAINT menu_user_sections_items_fk_category
    FOREIGN KEY (category_id)
    REFERENCES mx_dic.menu_user_sections_category(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_user_sections_items_is_default
  ON mx_dic.menu_user_sections_items(is_default)
  WHERE is_default = true;

COMMENT ON COLUMN mx_dic.menu_user_sections_items.is_default IS
  'Якщо true, пункт меню автоматично призначається новим користувачам при реєстрації та всім існуючим користувачам при встановленні';

-- Пункти меню без секцій
CREATE TABLE IF NOT EXISTS mx_dic.menu_user_items
(
  id          SERIAL      PRIMARY KEY,
  menu_id     int         NOT NULL,
  title       text        NOT NULL,
  icon        text        NOT NULL,
  url         text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 100,
  is_active   boolean     NOT NULL DEFAULT TRUE,
  is_default  boolean     NOT NULL DEFAULT FALSE,

  CONSTRAINT menu_user_items_fk_menu
    FOREIGN KEY (menu_id)
    REFERENCES mx_dic.menus(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_user_items_is_default
  ON mx_dic.menu_user_items(is_default)
  WHERE is_default = true;

COMMENT ON COLUMN mx_dic.menu_user_items.is_default IS
  'Якщо true, пункт меню автоматично призначається новим користувачам при реєстрації та всім існуючим користувачам при встановленні';

CREATE INDEX IF NOT EXISTS idx_menu_user_items_menu_id
  ON mx_dic.menu_user_items(menu_id);

-- Пункти загального меню (без прив'язки до офісу)
CREATE TABLE IF NOT EXISTS mx_dic.menu_general_items
(
  id          SERIAL      PRIMARY KEY,
  menu_id     int         NOT NULL,
  title       text        NOT NULL,
  icon        text        NOT NULL,
  url         text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 100,
  is_active   boolean     NOT NULL DEFAULT TRUE,
  is_default  boolean     NOT NULL DEFAULT FALSE,

  CONSTRAINT menu_general_items_fk_menu
    FOREIGN KEY (menu_id)
    REFERENCES mx_dic.menus(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_general_items_menu_id
  ON mx_dic.menu_general_items(menu_id);

COMMENT ON TABLE mx_dic.menu_general_items IS
'Пункти загального меню. Відображаються в сайдбарі завжди, незалежно від вибраного офісу.';

-- Меню підтримки
CREATE TABLE IF NOT EXISTS mx_dic.menu_app_support
(
  id SERIAL NOT NULL PRIMARY KEY,
  menu_id  int         NOT NULL,
  title    text        NOT NULL,
  url      text        NOT NULL,
  icon     text        NOT NULL,
  is_active boolean    NOT NULL DEFAULT TRUE,

  CONSTRAINT menu_app_support_fk_menu
    FOREIGN KEY (menu_id)
    REFERENCES mx_dic.menus(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_app_support_menu_id
  ON mx_dic.menu_app_support(menu_id);

COMMENT ON TABLE mx_dic.menu_app_support IS
'Меню підтримки та зворотнього звʼязку для застосунку.';

-- Категорії повноважень
CREATE TABLE IF NOT EXISTS mx_dic.user_permissions_category
(
  id          SERIAL PRIMARY KEY,
  title       text        NOT NULL,
  description text,
  icon        text        NOT NULL DEFAULT 'CircleCheck',
  is_active   boolean     NOT NULL DEFAULT TRUE
);

INSERT INTO mx_dic.user_permissions_category (title, description, icon, is_active) VALUES
 ('Документація', 'Створення документації застосунку', 'CircleCheck', true)
ON CONFLICT DO NOTHING;

-- Пункти повноважень
CREATE TABLE IF NOT EXISTS mx_dic.user_permissions_items
(
  id          SERIAL      PRIMARY KEY,
  category_id int         NOT NULL,
  title       text        NOT NULL,
  description text,
  sort_order  int         NOT NULL DEFAULT 100,
  is_active   boolean     NOT NULL DEFAULT TRUE,

  CONSTRAINT user_permissions_items_fk_category
    FOREIGN KEY (category_id)
    REFERENCES mx_dic.user_permissions_category(id)
    ON DELETE CASCADE
);

INSERT INTO mx_dic.user_permissions_items (category_id, title, description, sort_order, is_active) VALUES
 (1, 'Створення категорій документації', 'Дозволяє створювати категорії документації', 100, true),
 (1, 'Створення розділів документації', 'Дозволяє створювати розділи документації', 200, true),
 (1, 'Створення статей документації', 'Дозволяє створювати статті документації', 300, true)
ON CONFLICT DO NOTHING;

-- Офіси / філії компанії
CREATE TABLE IF NOT EXISTS mx_dic.offices (
  id           SERIAL PRIMARY KEY,
  title        text        NOT NULL,
  city         text,
  address      text,
  phone        text,
  email        text,
  link_map     text,
  latitude     numeric(10, 7),
  longitude    numeric(10, 7),
  zip          text,
  sort_order   int         NOT NULL DEFAULT 100,
  is_active    boolean     NOT NULL DEFAULT TRUE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE mx_dic.offices IS
'Філії, представництва або офіси як підрозділи компанії.';

CREATE INDEX IF NOT EXISTS idx_offices_sort_order ON mx_dic.offices(sort_order);
CREATE INDEX IF NOT EXISTS idx_offices_is_active ON mx_dic.offices(is_active);
CREATE INDEX IF NOT EXISTS idx_offices_city ON mx_dic.offices(city);

-- ============================================================
-- MX_SYSTEM: ПРИЗНАЧЕННЯ МЕНЮ, ПОВНОВАЖЕНЬ ТА ОФІСІВ
-- ============================================================

-- Призначення меню з секціями (прив'язано до офісу)
CREATE TABLE IF NOT EXISTS mx_system.nav_user_sections
(
  id         SERIAL      PRIMARY KEY,
  user_id    text        NOT NULL,
  menu_id    int         NOT NULL,
  office_id  int         NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by text        NOT NULL,

  CONSTRAINT nav_user_sections_fk_user
    FOREIGN KEY (user_id)
    REFERENCES public."user"(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_sections_fk_created_by
    FOREIGN KEY (created_by)
    REFERENCES public."user"(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_sections_fk_menu_item
    FOREIGN KEY (menu_id)
    REFERENCES mx_dic.menu_user_sections_items(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_sections_fk_office
    FOREIGN KEY (office_id)
    REFERENCES mx_dic.offices(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_sections_user_menu_office_unique
    UNIQUE (user_id, menu_id, office_id)
);

CREATE INDEX IF NOT EXISTS idx_nav_user_sections_user_office
  ON mx_system.nav_user_sections(user_id, office_id);

COMMENT ON COLUMN mx_system.nav_user_sections.office_id IS
  'Офіс, для якого діє цей дозвіл. Один пункт меню може бути активований для різних офісів незалежно.';

-- Призначення меню без секцій (прив'язано до офісу)
CREATE TABLE IF NOT EXISTS mx_system.nav_user_items
(
  id         SERIAL      NOT NULL PRIMARY KEY,
  user_id    text        NOT NULL,
  menu_id    int         NOT NULL,
  office_id  int         NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by text        NOT NULL,

  CONSTRAINT nav_user_items_fk_user
    FOREIGN KEY (user_id)
    REFERENCES public."user"(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_items_fk_created_by
    FOREIGN KEY (created_by)
    REFERENCES public."user"(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_items_fk_menu_item
    FOREIGN KEY (menu_id)
    REFERENCES mx_dic.menu_user_items(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_items_fk_office
    FOREIGN KEY (office_id)
    REFERENCES mx_dic.offices(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_items_user_menu_office_unique
    UNIQUE (user_id, menu_id, office_id)
);

CREATE INDEX IF NOT EXISTS idx_nav_user_items_user_office
  ON mx_system.nav_user_items(user_id, office_id);

COMMENT ON COLUMN mx_system.nav_user_items.office_id IS
  'Офіс, для якого діє цей дозвіл. Один пункт меню може бути активований для різних офісів незалежно.';

-- Призначення пунктів загального меню (без прив'язки до офісу)
CREATE TABLE IF NOT EXISTS mx_system.nav_user_general
(
  id               SERIAL      PRIMARY KEY,
  user_id          text        NOT NULL,
  menu_id          int         NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by       text        NOT NULL,
  is_auto_assigned boolean     NOT NULL DEFAULT false,

  CONSTRAINT nav_user_general_fk_user
    FOREIGN KEY (user_id)
    REFERENCES public."user"(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_general_fk_created_by
    FOREIGN KEY (created_by)
    REFERENCES public."user"(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_general_fk_menu_item
    FOREIGN KEY (menu_id)
    REFERENCES mx_dic.menu_general_items(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_general_user_menu_unique
    UNIQUE (user_id, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_nav_user_general_user_id
  ON mx_system.nav_user_general(user_id);

-- Призначення повноважень
CREATE TABLE IF NOT EXISTS mx_system.nav_user_permissions
(
  id         SERIAL      PRIMARY KEY,
  user_id    text        NOT NULL,
  permission_id int      NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by text        NOT NULL,

  CONSTRAINT nav_user_permissions_fk_user
    FOREIGN KEY (user_id)
    REFERENCES public."user"(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_permissions_fk_created_by
    FOREIGN KEY (created_by)
    REFERENCES public."user"(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_permissions_fk_permission_item
    FOREIGN KEY (permission_id)
    REFERENCES mx_dic.user_permissions_items(id)
    ON DELETE CASCADE,

  CONSTRAINT nav_user_permissions_user_permission_unique
    UNIQUE (user_id, permission_id)
);

-- Призначення офісів користувачам
CREATE TABLE IF NOT EXISTS mx_system.user_offices
(
  id         SERIAL      PRIMARY KEY,
  user_id    text        NOT NULL,
  office_id  int         NOT NULL,
  is_default boolean     NOT NULL DEFAULT FALSE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by text        NOT NULL,

  CONSTRAINT user_offices_fk_user
    FOREIGN KEY (user_id)
    REFERENCES public."user"(id)
    ON DELETE CASCADE,

  CONSTRAINT user_offices_fk_created_by
    FOREIGN KEY (created_by)
    REFERENCES public."user"(id)
    ON DELETE CASCADE,

  CONSTRAINT user_offices_fk_office
    FOREIGN KEY (office_id)
    REFERENCES mx_dic.offices(id)
    ON DELETE CASCADE,

  CONSTRAINT user_offices_user_office_unique
    UNIQUE (user_id, office_id)
);

-- ============================================================
-- MX_DATA: ПЕРСОНАЛЬНІ ДАНІ
-- ============================================================

-- Контакти
CREATE TABLE IF NOT EXISTS mx_data.user_contact (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text NOT NULL,
  contact_type_id smallint NOT NULL,
  contact_value   citext  NOT NULL,
  is_default      boolean NOT NULL DEFAULT false,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_contact_user_fk
    FOREIGN KEY (user_id)         REFERENCES public."user"(id)           ON DELETE CASCADE,
  CONSTRAINT user_contact_type_fk
    FOREIGN KEY (contact_type_id) REFERENCES mx_dic.dic_contact_type(id) ON DELETE RESTRICT,

  CONSTRAINT user_contact_unique_per_user UNIQUE (user_id, contact_type_id, contact_value)
);

COMMENT ON TABLE mx_data.user_contact IS
'Контакти користувачів (словникові типи). Забезпечує множинні канали зв’язку; рівно один is_default=TRUE на user_id.';

CREATE INDEX IF NOT EXISTS user_contact_user_idx ON mx_data.user_contact (user_id);
CREATE INDEX IF NOT EXISTS user_contact_type_idx ON mx_data.user_contact (contact_type_id);

DROP INDEX IF EXISTS mx_data.user_contact_default_one_per_user_idx;
CREATE UNIQUE INDEX IF NOT EXISTS user_contact_default_one_per_user_idx
  ON mx_data.user_contact (user_id)
  WHERE is_default = TRUE;

-- Профілі
CREATE TABLE IF NOT EXISTS mx_data.user_data (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL UNIQUE,
  full_name   text NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_data_user_fk
    FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE
);

COMMENT ON TABLE mx_data.user_data IS
'Профілі користувачів. Кожен профіль повинен мати щонайменше один контакт у mx_data.user_contact.';

-- ============================================================
-- ФУНКЦІЇ ТА ТРИГЕРИ: SORT_ORDER
-- ============================================================

-- menus sort_order
DROP FUNCTION IF EXISTS mx_dic.fn_menus_bi_sort_order();
DROP FUNCTION IF EXISTS mx_dic.fn_menus_bu_sort_order_reorder();
DROP FUNCTION IF EXISTS mx_dic.fn_menus_ad_sort_order_reorder();

CREATE OR REPLACE FUNCTION mx_dic.fn_menus_bi_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
    SELECT COALESCE(MAX(sort_order), 0) + 100
    INTO NEW.sort_order
    FROM mx_dic.menus;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_dic.fn_menus_bu_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.sort_order = OLD.sort_order THEN
    RETURN NEW;
  END IF;

  SET CONSTRAINTS ALL DEFERRED;

  IF NEW.sort_order < OLD.sort_order THEN
    UPDATE mx_dic.menus
    SET sort_order = sort_order + 100
    WHERE sort_order >= NEW.sort_order
      AND sort_order < OLD.sort_order
      AND id <> NEW.id;
  ELSE
    UPDATE mx_dic.menus
    SET sort_order = sort_order - 100
    WHERE sort_order <= NEW.sort_order
      AND sort_order > OLD.sort_order
      AND id <> NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_dic.fn_menus_ad_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  UPDATE mx_dic.menus
  SET sort_order = sort_order - 100
  WHERE sort_order > OLD.sort_order;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_menus_bi_sort_order ON mx_dic.menus;
DROP TRIGGER IF EXISTS trg_menus_bu_sort_order_reorder ON mx_dic.menus;
DROP TRIGGER IF EXISTS trg_menus_ad_sort_order_reorder ON mx_dic.menus;

CREATE TRIGGER trg_menus_bi_sort_order
  BEFORE INSERT ON mx_dic.menus
  FOR EACH ROW
  EXECUTE FUNCTION mx_dic.fn_menus_bi_sort_order();

CREATE TRIGGER trg_menus_bu_sort_order_reorder
  BEFORE UPDATE ON mx_dic.menus
  FOR EACH ROW
  WHEN (OLD.sort_order IS DISTINCT FROM NEW.sort_order)
  EXECUTE FUNCTION mx_dic.fn_menus_bu_sort_order_reorder();

CREATE TRIGGER trg_menus_ad_sort_order_reorder
  AFTER DELETE ON mx_dic.menus
  FOR EACH ROW
  EXECUTE FUNCTION mx_dic.fn_menus_ad_sort_order_reorder();

-- menu_user_sections_items sort_order
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_sections_items_bi_sort_order();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_sections_items_bu_sort_order_reorder();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_sections_items_ad_sort_order_reorder();

CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_sections_items_bi_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1
    INTO NEW.sort_order
    FROM mx_dic.menu_user_sections_items
    WHERE category_id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_sections_items_bu_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.sort_order = OLD.sort_order THEN
    RETURN NEW;
  END IF;

  IF NEW.category_id <> OLD.category_id THEN
    RETURN NEW;
  END IF;

  SET CONSTRAINTS ALL DEFERRED;

  IF NEW.sort_order < OLD.sort_order THEN
    UPDATE mx_dic.menu_user_sections_items
    SET sort_order = sort_order + 1
    WHERE category_id = NEW.category_id
      AND sort_order >= NEW.sort_order
      AND sort_order < OLD.sort_order
      AND id <> NEW.id;
  ELSE
    UPDATE mx_dic.menu_user_sections_items
    SET sort_order = sort_order - 1
    WHERE category_id = NEW.category_id
      AND sort_order <= NEW.sort_order
      AND sort_order > OLD.sort_order
      AND id <> NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_sections_items_ad_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  UPDATE mx_dic.menu_user_sections_items
  SET sort_order = sort_order - 1
  WHERE category_id = OLD.category_id
    AND sort_order > OLD.sort_order;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_menu_user_sections_items_bi_sort_order ON mx_dic.menu_user_sections_items;
DROP TRIGGER IF EXISTS trg_menu_user_sections_items_bu_sort_order_reorder ON mx_dic.menu_user_sections_items;
DROP TRIGGER IF EXISTS trg_menu_user_sections_items_ad_sort_order_reorder ON mx_dic.menu_user_sections_items;

CREATE TRIGGER trg_menu_user_sections_items_bi_sort_order
  BEFORE INSERT ON mx_dic.menu_user_sections_items
  FOR EACH ROW
  EXECUTE FUNCTION mx_dic.fn_menu_user_sections_items_bi_sort_order();

CREATE TRIGGER trg_menu_user_sections_items_bu_sort_order_reorder
  BEFORE UPDATE ON mx_dic.menu_user_sections_items
  FOR EACH ROW
  WHEN (OLD.sort_order IS DISTINCT FROM NEW.sort_order)
  EXECUTE FUNCTION mx_dic.fn_menu_user_sections_items_bu_sort_order_reorder();

CREATE TRIGGER trg_menu_user_sections_items_ad_sort_order_reorder
  AFTER DELETE ON mx_dic.menu_user_sections_items
  FOR EACH ROW
  EXECUTE FUNCTION mx_dic.fn_menu_user_sections_items_ad_sort_order_reorder();

-- menu_user_items sort_order
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_items_ai_sort_order();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_items_au_sort_order_reorder();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_items_ad_sort_order_reorder();

CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_items_ai_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1
    INTO NEW.sort_order
    FROM mx_dic.menu_user_items;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_items_au_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.sort_order = OLD.sort_order THEN
    RETURN NEW;
  END IF;

  SET CONSTRAINTS ALL DEFERRED;

  IF NEW.sort_order < OLD.sort_order THEN
    UPDATE mx_dic.menu_user_items
    SET sort_order = sort_order + 1
    WHERE sort_order >= NEW.sort_order
      AND sort_order < OLD.sort_order
      AND id <> NEW.id;
  ELSE
    UPDATE mx_dic.menu_user_items
    SET sort_order = sort_order - 1
    WHERE sort_order <= NEW.sort_order
      AND sort_order > OLD.sort_order
      AND id <> NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_items_ad_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  UPDATE mx_dic.menu_user_items
  SET sort_order = sort_order - 1
  WHERE sort_order > OLD.sort_order;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_menu_user_items_ai_sort_order ON mx_dic.menu_user_items;
DROP TRIGGER IF EXISTS trg_menu_user_items_au_sort_order_reorder ON mx_dic.menu_user_items;
DROP TRIGGER IF EXISTS trg_menu_user_items_ad_sort_order_reorder ON mx_dic.menu_user_items;

CREATE TRIGGER trg_menu_user_items_ai_sort_order
  BEFORE INSERT ON mx_dic.menu_user_items
  FOR EACH ROW
  EXECUTE FUNCTION mx_dic.fn_menu_user_items_ai_sort_order();

CREATE TRIGGER trg_menu_user_items_au_sort_order_reorder
  BEFORE UPDATE ON mx_dic.menu_user_items
  FOR EACH ROW
  WHEN (OLD.sort_order IS DISTINCT FROM NEW.sort_order)
  EXECUTE FUNCTION mx_dic.fn_menu_user_items_au_sort_order_reorder();

CREATE TRIGGER trg_menu_user_items_ad_sort_order_reorder
  AFTER DELETE ON mx_dic.menu_user_items
  FOR EACH ROW
  EXECUTE FUNCTION mx_dic.fn_menu_user_items_ad_sort_order_reorder();

-- user_permissions_items sort_order
DROP FUNCTION IF EXISTS mx_dic.fn_user_permissions_items_bi_sort_order();
DROP FUNCTION IF EXISTS mx_dic.fn_user_permissions_items_bu_sort_order_reorder();
DROP FUNCTION IF EXISTS mx_dic.fn_user_permissions_items_ad_sort_order_reorder();

CREATE OR REPLACE FUNCTION mx_dic.fn_user_permissions_items_bi_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1
    INTO NEW.sort_order
    FROM mx_dic.user_permissions_items
    WHERE category_id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_dic.fn_user_permissions_items_bu_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.sort_order = OLD.sort_order THEN
    RETURN NEW;
  END IF;

  IF NEW.category_id <> OLD.category_id THEN
    RETURN NEW;
  END IF;

  SET CONSTRAINTS ALL DEFERRED;

  IF NEW.sort_order < OLD.sort_order THEN
    UPDATE mx_dic.user_permissions_items
    SET sort_order = sort_order + 1
    WHERE category_id = NEW.category_id
      AND sort_order >= NEW.sort_order
      AND sort_order < OLD.sort_order
      AND id <> NEW.id;
  ELSE
    UPDATE mx_dic.user_permissions_items
    SET sort_order = sort_order - 1
    WHERE category_id = NEW.category_id
      AND sort_order <= NEW.sort_order
      AND sort_order > OLD.sort_order
      AND id <> NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_dic.fn_user_permissions_items_ad_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  UPDATE mx_dic.user_permissions_items
  SET sort_order = sort_order - 1
  WHERE category_id = OLD.category_id
    AND sort_order > OLD.sort_order;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_permissions_items_bi_sort_order ON mx_dic.user_permissions_items;
DROP TRIGGER IF EXISTS trg_user_permissions_items_bu_sort_order_reorder ON mx_dic.user_permissions_items;
DROP TRIGGER IF EXISTS trg_user_permissions_items_ad_sort_order_reorder ON mx_dic.user_permissions_items;

CREATE TRIGGER trg_user_permissions_items_bi_sort_order
  BEFORE INSERT ON mx_dic.user_permissions_items
  FOR EACH ROW
  EXECUTE FUNCTION mx_dic.fn_user_permissions_items_bi_sort_order();

CREATE TRIGGER trg_user_permissions_items_bu_sort_order_reorder
  BEFORE UPDATE ON mx_dic.user_permissions_items
  FOR EACH ROW
  WHEN (OLD.sort_order IS DISTINCT FROM NEW.sort_order)
  EXECUTE FUNCTION mx_dic.fn_user_permissions_items_bu_sort_order_reorder();

CREATE TRIGGER trg_user_permissions_items_ad_sort_order_reorder
  AFTER DELETE ON mx_dic.user_permissions_items
  FOR EACH ROW
  EXECUTE FUNCTION mx_dic.fn_user_permissions_items_ad_sort_order_reorder();

-- offices sort_order
DROP FUNCTION IF EXISTS mx_dic.fn_offices_bi_sort_order();
DROP FUNCTION IF EXISTS mx_dic.fn_offices_bu_sort_order_reorder();
DROP FUNCTION IF EXISTS mx_dic.fn_offices_ad_sort_order_reorder();

CREATE OR REPLACE FUNCTION mx_dic.fn_offices_bi_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
    SELECT COALESCE(MAX(sort_order), 0) + 100
    INTO NEW.sort_order
    FROM mx_dic.offices;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_dic.fn_offices_bu_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.sort_order = OLD.sort_order THEN
    RETURN NEW;
  END IF;

  SET CONSTRAINTS ALL DEFERRED;

  IF NEW.sort_order < OLD.sort_order THEN
    UPDATE mx_dic.offices
    SET sort_order = sort_order + 100
    WHERE sort_order >= NEW.sort_order
      AND sort_order < OLD.sort_order
      AND id <> NEW.id;
  ELSE
    UPDATE mx_dic.offices
    SET sort_order = sort_order - 100
    WHERE sort_order <= NEW.sort_order
      AND sort_order > OLD.sort_order
      AND id <> NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_dic.fn_offices_ad_sort_order_reorder()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  UPDATE mx_dic.offices
  SET sort_order = sort_order - 100
  WHERE sort_order > OLD.sort_order;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_offices_bi_sort_order ON mx_dic.offices;
DROP TRIGGER IF EXISTS trg_offices_bu_sort_order_reorder ON mx_dic.offices;
DROP TRIGGER IF EXISTS trg_offices_ad_sort_order_reorder ON mx_dic.offices;
DROP TRIGGER IF EXISTS trg_offices_bu_set_updated_at ON mx_dic.offices;

CREATE TRIGGER trg_offices_bi_sort_order
  BEFORE INSERT ON mx_dic.offices
  FOR EACH ROW
  EXECUTE FUNCTION mx_dic.fn_offices_bi_sort_order();

CREATE TRIGGER trg_offices_bu_sort_order_reorder
  BEFORE UPDATE ON mx_dic.offices
  FOR EACH ROW
  WHEN (OLD.sort_order IS DISTINCT FROM NEW.sort_order)
  EXECUTE FUNCTION mx_dic.fn_offices_bu_sort_order_reorder();

CREATE TRIGGER trg_offices_ad_sort_order_reorder
  AFTER DELETE ON mx_dic.offices
  FOR EACH ROW
  EXECUTE FUNCTION mx_dic.fn_offices_ad_sort_order_reorder();

CREATE TRIGGER trg_offices_bu_set_updated_at
  BEFORE UPDATE ON mx_dic.offices
  FOR EACH ROW
  EXECUTE FUNCTION mx_global.set_updated_at();

-- ============================================================
-- ФУНКЦІЇ ТА ТРИГЕРИ: IS_DEFAULT ДЛЯ USER_OFFICES
-- ============================================================

DROP FUNCTION IF EXISTS mx_system.fn_user_offices_biu_is_default();
DROP FUNCTION IF EXISTS mx_system.fn_user_offices_ad_is_default();

CREATE OR REPLACE FUNCTION mx_system.fn_user_offices_biu_is_default()
    RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (SELECT COUNT(*) FROM mx_system.user_offices WHERE user_id = NEW.user_id) = 0 THEN
            NEW.is_default := TRUE;
        ELSE
            NEW.is_default := FALSE;
        END IF;
    ELSIF (TG_OP = 'UPDATE' AND NEW.is_default = TRUE AND OLD.is_default = FALSE) THEN
        UPDATE mx_system.user_offices
        SET is_default = FALSE
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mx_system.fn_user_offices_ad_is_default()
    RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_default = TRUE THEN
        UPDATE mx_system.user_offices
        SET is_default = TRUE
        WHERE id = (
            SELECT id
            FROM mx_system.user_offices
            WHERE user_id = OLD.user_id
            ORDER BY id
            LIMIT 1
        );
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_offices_biu_is_default ON mx_system.user_offices;
DROP TRIGGER IF EXISTS trg_user_offices_ad_is_default ON mx_system.user_offices;

CREATE TRIGGER trg_user_offices_biu_is_default
    BEFORE INSERT OR UPDATE OF is_default
    ON mx_system.user_offices
    FOR EACH ROW
EXECUTE FUNCTION mx_system.fn_user_offices_biu_is_default();

CREATE TRIGGER trg_user_offices_ad_is_default
    AFTER DELETE
    ON mx_system.user_offices
    FOR EACH ROW
EXECUTE FUNCTION mx_system.fn_user_offices_ad_is_default();

-- ============================================================
-- ФУНКЦІЇ ТА ТРИГЕРИ: СИНХРОНІЗАЦІЯ АКТИВНОСТІ
-- ============================================================

-- menu_user_sections_category → menu_user_sections_items
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_sections_category_au_sync_items_active();
CREATE OR REPLACE FUNCTION mx_dic.fn_menu_user_sections_category_au_sync_items_active()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    UPDATE mx_dic.menu_user_sections_items
    SET is_active = NEW.is_active
    WHERE category_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_menu_user_sections_category_au_sync_items_active
  ON mx_dic.menu_user_sections_category;
CREATE TRIGGER trg_menu_user_sections_category_au_sync_items_active
  AFTER UPDATE ON mx_dic.menu_user_sections_category
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION mx_dic.fn_menu_user_sections_category_au_sync_items_active();

-- user_permissions_category → user_permissions_items
DROP FUNCTION IF EXISTS mx_dic.fn_user_permissions_category_au_sync_items_active();
CREATE OR REPLACE FUNCTION mx_dic.fn_user_permissions_category_au_sync_items_active()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    UPDATE mx_dic.user_permissions_items
    SET is_active = NEW.is_active
    WHERE category_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_permissions_category_au_sync_items_active
  ON mx_dic.user_permissions_category;
CREATE TRIGGER trg_user_permissions_category_au_sync_items_active
  AFTER UPDATE ON mx_dic.user_permissions_category
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION mx_dic.fn_user_permissions_category_au_sync_items_active();

-- ============================================================
-- ФУНКЦІЇ ТА ТРИГЕРИ: МЕНЮ ЗА ЗАМОВЧУВАННЯМ
-- (вимкнено — після додавання office_id до nav_user_sections/items
--  автоматичне призначення стало неоднозначним: неможливо визначити,
--  для якого офісу призначати. Меню призначається вручну в контексті офісу.)
-- ============================================================

DROP TRIGGER IF EXISTS trg_menu_user_sections_items_au_assign_default
  ON mx_dic.menu_user_sections_items;
DROP TRIGGER IF EXISTS trg_menu_user_items_au_assign_default
  ON mx_dic.menu_user_items;

DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_sections_items_au_assign_default();
DROP FUNCTION IF EXISTS mx_dic.fn_menu_user_items_au_assign_default();

-- ============================================================
-- MX_DATA: ФУНКЦІЇ ТА ТРИГЕРИ
-- ============================================================

-- updated_at на user_contact
DROP TRIGGER IF EXISTS trg_user_contact_bu_set_updated_at ON mx_data.user_contact;
CREATE TRIGGER trg_user_contact_bu_set_updated_at
BEFORE UPDATE ON mx_data.user_contact
FOR EACH ROW
EXECUTE FUNCTION mx_global.set_updated_at();

-- Валідація contact_value
DROP FUNCTION IF EXISTS mx_data.fn_user_contact_bi_validate() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_user_contact_bi_validate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
BEGIN
  SELECT d.code INTO v_code
  FROM mx_dic.dic_contact_type d
  WHERE d.id = COALESCE(NEW.contact_type_id, OLD.contact_type_id);

  IF v_code IS NULL THEN
    RAISE EXCEPTION 'Невідомий contact_type_id=%', NEW.contact_type_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM mx_dic.dic_contact_type d
    WHERE d.id = NEW.contact_type_id AND d.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Тип контакту (% / id=%) деактивований', v_code, NEW.contact_type_id;
  END IF;

  NEW.contact_value := btrim(NEW.contact_value);

  IF v_code = 'phone' THEN
    IF NEW.contact_value !~ '^\+?[1-9][0-9]{6,14}$' THEN
      RAISE EXCEPTION 'Некоректний номер телефону (очікується E.164-подібний формат)';
    END IF;

  ELSIF v_code = 'email' THEN
    IF NEW.contact_value !~ '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Некоректна адреса електронної пошти';
    END IF;

  ELSIF v_code = 'telegram' THEN
    IF NEW.contact_value !~ '^\+?[1-9][0-9]{6,14}$' AND
       NEW.contact_value !~ '^@?[A-Za-z0-9_]{5,}$' AND
       NEW.contact_value !~ '^(https?://)?(t\.me|telegram\.me)/[A-Za-z0-9_]+/?$' THEN
      RAISE EXCEPTION 'Некоректний формат Telegram (очікується: номер телефону, @username або t.me/username)';
    END IF;

  ELSIF v_code = 'facebook' THEN
    IF NEW.contact_value !~ '^(https?://(www\.|m\.|mbasic\.)?(facebook|fb)\.(com|me)/[A-Za-z0-9_.\-]+/?|@?[A-Za-z0-9_.\-]+)$' THEN
      RAISE EXCEPTION 'Некоректний Facebook username/URL';
    END IF;

  ELSIF v_code = 'instagram' THEN
    IF NEW.contact_value !~ '^(https?://(www\.)?instagram\.com/[A-Za-z0-9_.\-]+/?|@?[A-Za-z0-9_.\-]+)$' THEN
      RAISE EXCEPTION 'Некоректний Instagram username/URL';
    END IF;

  ELSIF v_code = 'messenger' THEN
    IF NEW.contact_value !~ '^(https?://(www\.|m\.)?(messenger\.com/t|m\.me)/[A-Za-z0-9_.\-]+/?|@?[A-Za-z0-9_.\-]+)$' THEN
      RAISE EXCEPTION 'Некоректний Messenger username/URL';
    END IF;

  ELSIF v_code = 'viber' THEN
    IF NEW.contact_value !~ '^\+?[1-9][0-9]{6,14}$' AND
       NEW.contact_value !~ '^(https?://)?(www\.)?viber\.com/[A-Za-z0-9_.\-]+/?$' THEN
      RAISE EXCEPTION 'Некоректний формат Viber (очікується: номер телефону або viber.com/username)';
    END IF;

  ELSIF v_code = 'whatsapp' THEN
    IF NEW.contact_value !~ '^\+?[1-9][0-9]{6,14}$' AND
       NEW.contact_value !~ '^(https?://)?(wa\.me|api\.whatsapp\.com)/[0-9]+/?$' THEN
      RAISE EXCEPTION 'Некоректний формат WhatsApp (очікується: номер телефону або wa.me/номер)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_contact_bi_validate ON mx_data.user_contact;
CREATE TRIGGER trg_user_contact_bi_validate
BEFORE INSERT OR UPDATE ON mx_data.user_contact
FOR EACH ROW
EXECUTE FUNCTION mx_data.fn_user_contact_bi_validate();

-- Підтримка «рівно один дефолтний» контакт
DROP FUNCTION IF EXISTS mx_data.fn_user_contact_bu_maintain_default() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_user_contact_bu_maintain_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default AND (OLD.is_default IS DISTINCT FROM NEW.is_default) THEN
    UPDATE mx_data.user_contact
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id <> NEW.id AND is_default = TRUE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_contact_bu_maintain_default ON mx_data.user_contact;
CREATE TRIGGER trg_user_contact_bu_maintain_default
BEFORE UPDATE ON mx_data.user_contact
FOR EACH ROW
EXECUTE FUNCTION mx_data.fn_user_contact_bu_maintain_default();

DROP FUNCTION IF EXISTS mx_data.fn_user_contact_aid_maintain_default() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_user_contact_aid_maintain_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_others boolean;
  v_new_id     uuid;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM mx_data.user_contact WHERE user_id = NEW.user_id AND id <> NEW.id) THEN
      IF NEW.is_default IS FALSE THEN
        UPDATE mx_data.user_contact
        SET is_default = TRUE
        WHERE id = NEW.id;
      END IF;
    END IF;

    IF NEW.is_default THEN
      UPDATE mx_data.user_contact
      SET is_default = FALSE
      WHERE user_id = NEW.user_id AND id <> NEW.id AND is_default IS TRUE;
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_default THEN
      SELECT EXISTS (SELECT 1 FROM mx_data.user_contact WHERE user_id = OLD.user_id)
      INTO v_has_others;

      IF v_has_others THEN
        SELECT id
        INTO v_new_id
        FROM mx_data.user_contact
        WHERE user_id = OLD.user_id
        ORDER BY is_default DESC, updated_at DESC
        LIMIT 1;

        UPDATE mx_data.user_contact
        SET is_default = TRUE
        WHERE id = v_new_id;
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_user_contact_aid_maintain_default ON mx_data.user_contact;
CREATE TRIGGER trg_user_contact_aid_maintain_default
AFTER INSERT OR DELETE ON mx_data.user_contact
FOR EACH ROW
EXECUTE FUNCTION mx_data.fn_user_contact_aid_maintain_default();

-- updated_at на user_data
DROP TRIGGER IF EXISTS trg_user_data_bu_set_updated_at ON mx_data.user_data;
CREATE TRIGGER trg_user_data_bu_set_updated_at
BEFORE UPDATE ON mx_data.user_data
FOR EACH ROW
EXECUTE FUNCTION mx_global.set_updated_at();

-- Інтегриті: профіль має мати мінімум 1 контакт
DROP FUNCTION IF EXISTS mx_data.fn_check_user_data_has_contacts_aud() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_check_user_data_has_contacts_aud()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id text;
  v_cnt     integer;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  IF NOT EXISTS (SELECT 1 FROM mx_data.user_data WHERE user_id = v_user_id) THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*) INTO v_cnt
  FROM mx_data.user_contact
  WHERE user_id = v_user_id;

  IF v_cnt < 1 THEN
    RAISE EXCEPTION 'Порушення цілісності: профіль користувача (%) не має жодного контакту.', v_user_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_data_aud_has_contact ON mx_data.user_data;
CREATE CONSTRAINT TRIGGER trg_user_data_aud_has_contact
AFTER INSERT OR UPDATE OR DELETE ON mx_data.user_data
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION mx_data.fn_check_user_data_has_contacts_aud();

DROP TRIGGER IF EXISTS trg_user_contact_aud_has_contact ON mx_data.user_contact;
CREATE CONSTRAINT TRIGGER trg_user_contact_aud_has_contact
AFTER INSERT OR UPDATE OR DELETE ON mx_data.user_contact
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION mx_data.fn_check_user_data_has_contacts_aud();

-- Утиліта побудови URL контакту
DROP FUNCTION IF EXISTS mx_data.fn_contact_build_url(text, citext);
CREATE OR REPLACE FUNCTION mx_data.fn_contact_build_url(p_code text, p_value citext)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v text := trim(both from p_value::text);
  v_digits text;
BEGIN
  IF p_code IS NULL OR v = '' THEN
    RETURN NULL;
  END IF;

  IF p_code = 'phone' THEN
    v := regexp_replace(v, '[^0-9+]', '', 'g');
    IF v !~ '^\+' THEN
      v := '+' || regexp_replace(v, '[^0-9]', '', 'g');
    END IF;
    RETURN 'tel:' || v;

  ELSIF p_code = 'email' THEN
    RETURN 'mailto:' || lower(v);

  ELSIF p_code = 'telegram' THEN
    v := regexp_replace(v, '^https?://(www\.)?t\.me/', '', 'i');
    v := regexp_replace(v, '^@', '');
    RETURN 'https://t.me/' || v;

  ELSIF p_code = 'viber' THEN
    v := regexp_replace(v, '[^0-9+]', '', 'g');
    IF v !~ '^\+' THEN
      v := '+' || regexp_replace(v, '[^0-9]', '', 'g');
    END IF;
    RETURN 'viber://add?number=' || v;

  ELSIF p_code = 'whatsapp' THEN
    v_digits := regexp_replace(v, '[^0-9]', '', 'g');
    RETURN 'https://wa.me/' || v_digits;

  ELSIF p_code = 'facebook' THEN
    IF v ~* '^https?://' THEN
      RETURN v;
    END IF;
    RETURN 'https://facebook.com/' || v;

  ELSIF p_code = 'instagram' THEN
    IF v ~* '^https?://' THEN
      RETURN v;
    END IF;
    v := regexp_replace(v, '^https?://(www\.)?instagram\.com/', '', 'i');
    v := regexp_replace(v, '^@', '');
    RETURN 'https://instagram.com/' || v;

  ELSIF p_code = 'messenger' THEN
    IF v ~* '^https?://' THEN
      RETURN v;
    END IF;
    RETURN 'https://m.me/' || v;

  ELSE
    RETURN COALESCE(
      (SELECT url_prefix FROM mx_dic.dic_contact_type WHERE code = p_code LIMIT 1),
      ''
    ) || v;
  END IF;
END;
$$;

-- ============================================================
-- ПРЕДСТАВЛЕННЯ (VIEW)
-- ============================================================

-- mx_data.user_data_with_contact_view
CREATE OR REPLACE VIEW mx_data.user_data_with_contact_view AS
SELECT
  ud.id            AS user_data_id,
  ud.user_id,
  u.name AS user_name,
  u.image AS user_image,
  ud.full_name,
  ud.created_at,
  ud.updated_at,

  uc.contact_value,
  dct.code         AS contact_type_code,
  uc.contact_type_id,

  -- клікабельна URL, побудована за code + value
  mx_data.fn_contact_build_url(dct.code, uc.contact_value) AS contact_url
FROM mx_data.user_data ud
    LEFT JOIN LATERAL (
      SELECT c.contact_value, c.contact_type_id
      FROM mx_data.user_contact c
      WHERE c.user_id = ud.user_id
      ORDER BY c.is_default DESC, c.updated_at DESC
      LIMIT 1
    ) uc ON TRUE
    LEFT JOIN mx_dic.dic_contact_type dct   ON dct.id = uc.contact_type_id
    LEFT JOIN public."user" u ON u.id = ud.user_id;

COMMENT ON VIEW mx_data.user_data_with_contact_view IS
'Профіль користувача + актуальний контакт (дефолтний або найсвіжіший) з підписом типу із словника.';

-- public.user_view
CREATE OR REPLACE VIEW public.user_view AS
SELECT
  u.id,
  u.name,
  ud.full_name,
  u.email,
  u."emailVerified" AS email_verified,
  u.image,
  u.role,
  u."isBanned" AS is_banned,
  u."twoFactorEnabled" AS two_factor_enabled,
  EXISTS(SELECT 1 FROM passkey p WHERE p."userId" = u.id) AS has_passkey,
  u."createdAt" AS created_at,
  u."updatedAt" AS updated_at
FROM public."user" u
LEFT JOIN mx_data.user_data ud ON ud.user_id = u.id;

-- mx_system.nav_user_sections_user_view
-- Показує пункти для поточного дефолтного офісу:
--   - явно призначені (nav_user_sections) для цього офісу
--   - АБО is_default = true — для всіх офісів користувача
CREATE OR REPLACE VIEW mx_system.nav_user_sections_user_view AS
SELECT DISTINCT ON (u.id, i.id)
    u.id                                    AS user_id,
    uo.office_id                            AS office_id,
    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,
    c.id                                    AS category_id,
    c.title                                 AS category_title,
    c.url                                   AS category_url,
    c.icon                                  AS category_icon,
    c.is_active                             AS category_is_active,
    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global
FROM
    public."user" u
    JOIN mx_system.user_offices uo
        ON uo.user_id = u.id
       AND uo.is_default = TRUE
    CROSS JOIN mx_dic.menu_user_sections_items i
    JOIN mx_dic.menu_user_sections_category c
        ON c.id = i.category_id
    JOIN mx_dic.menus m
        ON m.id = c.menu_id
WHERE
    m.is_active = TRUE
    AND c.is_active = TRUE
    AND i.is_active = TRUE
    AND (
        EXISTS (
            SELECT 1 FROM mx_system.nav_user_sections nus
            WHERE nus.user_id = u.id
              AND nus.menu_id = i.id
              AND nus.office_id = uo.office_id
        )
        OR i.is_default = TRUE
    )
ORDER BY
    u.id,
    i.id,
    m.sort_order,
    m.id,
    c.id,
    i.sort_order;

-- mx_system.nav_user_sections_admin_view
-- 3D-матриця: user × office × menu_item (для адмін-панелі)
CREATE OR REPLACE VIEW mx_system.nav_user_sections_admin_view AS
SELECT
    u.id                                    AS user_id,
    u.name                                  AS user_name,

    o.id                                    AS office_id,
    o.title                                 AS office_title,

    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    c.id                                    AS category_id,
    c.title                                 AS category_title,
    c.url                                   AS category_url,
    c.icon                                  AS category_icon,
    c.is_active                             AS category_is_active,

    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global,

    (nus.id IS NOT NULL)                    AS item_is_assigned,
    (nus.id IS NOT NULL)
        AND i.is_active
        AND c.is_active
        AND m.is_active                     AS item_is_effective_active,

    nus.id                                  AS nav_user_section_id,
    nus.created_at                          AS created_at,
    nus.created_by                          AS created_by
FROM
    public."user" u
    CROSS JOIN mx_dic.offices o
    CROSS JOIN mx_dic.menus m
    JOIN mx_dic.menu_user_sections_category c
        ON c.menu_id = m.id
    JOIN mx_dic.menu_user_sections_items i
        ON i.category_id = c.id
    LEFT JOIN mx_system.nav_user_sections nus
        ON nus.user_id = u.id
       AND nus.office_id = o.id
       AND nus.menu_id = i.id
ORDER BY
    u.name,
    o.sort_order,
    o.id,
    m.sort_order,
    m.id,
    c.id,
    i.sort_order,
    i.id;

-- mx_system.nav_user_items_user_view
-- Показує пункти для поточного дефолтного офісу:
--   - явно призначені (nav_user_items) для цього офісу
--   - АБО is_default = true — для всіх офісів користувача
CREATE OR REPLACE VIEW mx_system.nav_user_items_user_view AS
SELECT DISTINCT ON (u.id, i.id)
    u.id                         AS user_id,
    uo.office_id                 AS office_id,
    m.id                         AS menu_id,
    m.title                      AS menu_title,
    m.sort_order                 AS menu_sort_order,
    i.id                         AS item_id,
    i.title                      AS item_title,
    i.icon                       AS item_icon,
    i.url                        AS item_url,
    i.sort_order                 AS item_sort_order,
    i.is_active                  AS item_is_active_global
FROM
    public."user" u
    JOIN mx_system.user_offices uo
        ON uo.user_id = u.id
       AND uo.is_default = TRUE
    CROSS JOIN mx_dic.menu_user_items i
    JOIN mx_dic.menus m
        ON m.id = i.menu_id
WHERE
    m.is_active = TRUE
    AND i.is_active = TRUE
    AND (
        EXISTS (
            SELECT 1 FROM mx_system.nav_user_items nui
            WHERE nui.user_id = u.id
              AND nui.menu_id = i.id
              AND nui.office_id = uo.office_id
        )
        OR i.is_default = TRUE
    )
ORDER BY
    u.id,
    i.id,
    m.sort_order,
    m.id,
    i.sort_order;

-- mx_system.nav_user_items_admin_view
-- 3D-матриця: user × office × menu_item (для адмін-панелі)
CREATE OR REPLACE VIEW mx_system.nav_user_items_admin_view AS
SELECT
    u.id                         AS user_id,
    u.name                       AS user_name,

    o.id                         AS office_id,
    o.title                      AS office_title,

    m.id                         AS menu_id,
    m.title                      AS menu_title,
    m.sort_order                 AS menu_sort_order,

    i.id                         AS item_id,
    i.title                      AS item_title,
    i.icon                       AS item_icon,
    i.url                        AS item_url,
    i.sort_order                 AS item_sort_order,
    i.is_active                  AS item_is_active_global,

    (nui.id IS NOT NULL)         AS item_is_assigned,
    (nui.id IS NOT NULL)
        AND i.is_active
        AND m.is_active          AS item_is_effective_active,

    nui.id                       AS nav_user_item_id,
    nui.created_at               AS created_at,
    nui.created_by               AS created_by
FROM
    public."user" u
    CROSS JOIN mx_dic.offices o
    CROSS JOIN mx_dic.menus m
    JOIN mx_dic.menu_user_items i
        ON i.menu_id = m.id
    LEFT JOIN mx_system.nav_user_items nui
        ON nui.user_id = u.id
       AND nui.office_id = o.id
       AND nui.menu_id = i.id
ORDER BY
    u.name,
    o.sort_order,
    o.id,
    m.sort_order,
    m.id,
    i.sort_order,
    i.id;

-- mx_system.nav_user_general_admin_view
-- 2D-матриця: user × menu_general_items (для адмін-панелі)
CREATE OR REPLACE VIEW mx_system.nav_user_general_admin_view AS
SELECT
    u.id                                    AS user_id,
    u.name                                  AS user_name,

    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global,

    (nug.id IS NOT NULL)                    AS item_is_assigned,
    (nug.id IS NOT NULL)
        AND i.is_active
        AND m.is_active                     AS item_is_effective_active,

    nug.id                                  AS nav_user_general_id,
    nug.created_at                          AS created_at,
    nug.created_by                          AS created_by
FROM
    public."user" u
    CROSS JOIN mx_dic.menus m
    JOIN mx_dic.menu_general_items i
        ON i.menu_id = m.id
    LEFT JOIN mx_system.nav_user_general nug
        ON nug.user_id = u.id
       AND nug.menu_id = i.id
ORDER BY
    u.name,
    m.sort_order,
    m.id,
    i.sort_order,
    i.id;

-- mx_system.nav_user_general_user_view
-- Пункти загального меню для сайдбару (без фільтрації за офісом):
--   - явно призначені користувачу (nav_user_general)
--   - АБО is_default = true — видно всім активним користувачам
CREATE OR REPLACE VIEW mx_system.nav_user_general_user_view AS
SELECT DISTINCT ON (u.id, i.id)
    u.id                                    AS user_id,

    m.id                                    AS menu_id,
    m.title                                 AS menu_title,
    m.sort_order                            AS menu_sort_order,

    i.id                                    AS item_id,
    i.title                                 AS item_title,
    i.icon                                  AS item_icon,
    i.url                                   AS item_url,
    i.sort_order                            AS item_sort_order,
    i.is_active                             AS item_is_active_global
FROM
    public."user" u
    CROSS JOIN mx_dic.menu_general_items i
    JOIN mx_dic.menus m
        ON m.id = i.menu_id
WHERE
    m.is_active = TRUE
    AND i.is_active = TRUE
    AND (
        EXISTS (
            SELECT 1 FROM mx_system.nav_user_general nug
            WHERE nug.user_id = u.id AND nug.menu_id = i.id
        )
        OR i.is_default = TRUE
    )
ORDER BY
    u.id,
    i.id,
    m.sort_order,
    m.id,
    i.sort_order;

-- mx_system.nav_user_permissions_admin_view
CREATE OR REPLACE VIEW mx_system.nav_user_permissions_admin_view AS
SELECT
  u.id                                    AS user_id,
  u.name                                  AS user_name,
  c.id                                    AS category_id,
  c.title                                 AS category_title,
  c.description                           AS category_description,
  c.icon                                  AS category_icon,
  c.is_active                             AS category_is_active,
  p.id                                    AS permission_id,
  p.title                                 AS permission_title,
  p.description                           AS permission_description,
  p.sort_order                            AS permission_sort_order,
  p.is_active                             AS permission_is_active_global,
  (nup.id IS NOT NULL)                    AS permission_is_assigned,
  (nup.id IS NOT NULL)
    AND p.is_active
    AND c.is_active                       AS permission_is_effective_active,
  nup.id                                  AS nav_user_permission_id,
  nup.created_at                          AS created_at,
  nup.created_by                          AS created_by
FROM
  public."user" u
  CROSS JOIN mx_dic.user_permissions_category c
  JOIN mx_dic.user_permissions_items p
    ON p.category_id = c.id
  LEFT JOIN mx_system.nav_user_permissions nup
    ON nup.user_id = u.id
   AND nup.permission_id = p.id
ORDER BY
  u.name,
  c.id,
  p.sort_order,
  p.id;

-- mx_system.nav_user_permissions_user_view
CREATE OR REPLACE VIEW mx_system.nav_user_permissions_user_view AS
SELECT
  u.id                                    AS user_id,
  c.id                                    AS category_id,
  c.title                                 AS category_title,
  c.description                           AS category_description,
  c.icon                                  AS category_icon,
  c.is_active                             AS category_is_active,
  p.id                                    AS permission_id,
  p.title                                 AS permission_title,
  p.description                           AS permission_description,
  p.sort_order                            AS permission_sort_order,
  p.is_active                             AS permission_is_active_global
FROM
  mx_system.nav_user_permissions nup
  JOIN public."user" u
    ON u.id = nup.user_id
  JOIN mx_dic.user_permissions_items p
    ON p.id = nup.permission_id
  JOIN mx_dic.user_permissions_category c
    ON c.id = p.category_id
WHERE
  c.is_active = TRUE
  AND p.is_active = TRUE
ORDER BY
  u.id,
  c.id,
  p.sort_order,
  p.id;

-- mx_system.user_offices_admin_view
CREATE OR REPLACE VIEW mx_system.user_offices_admin_view AS
SELECT
  u.id                                    AS user_id,
  u.name                                  AS user_name,
  o.id                                    AS office_id,
  o.title                                 AS office_title,
  o.city                                  AS office_city,
  o.is_active                             AS office_is_active,
  o.sort_order                            AS office_sort_order,
  (uo.id IS NOT NULL)                     AS office_is_assigned,
  (uo.id IS NOT NULL)
    AND o.is_active                       AS office_is_effective_active,
  COALESCE(uo.is_default, FALSE)          AS office_is_default,
  uo.id                                   AS user_office_id,
  uo.created_at                           AS created_at,
  uo.created_by                           AS created_by
FROM
  public."user" u
  CROSS JOIN mx_dic.offices o
  LEFT JOIN mx_system.user_offices uo
    ON uo.user_id = u.id
   AND uo.office_id = o.id
ORDER BY
  u.name,
  o.sort_order,
  o.id;

-- mx_system.user_offices_user_view
CREATE OR REPLACE VIEW mx_system.user_offices_user_view AS
SELECT
  u.id                                    AS user_id,
  o.id                                    AS office_id,
  o.title                                 AS office_title,
  o.city                                  AS office_city,
  o.address                               AS office_address,
  o.phone                                 AS office_phone,
  o.email                                 AS office_email,
  uo.is_default                           AS office_is_default
FROM
  mx_system.user_offices uo
  JOIN public."user" u
    ON u.id = uo.user_id
  JOIN mx_dic.offices o
    ON o.id = uo.office_id
WHERE
  o.is_active = TRUE
ORDER BY
  uo.is_default DESC,
  u.id,
  o.sort_order,
  o.id;
