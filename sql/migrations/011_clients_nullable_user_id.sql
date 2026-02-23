-- ======================================================
-- МІГРАЦІЯ 011: Підтримка клієнтів без акаунту
-- ======================================================
-- Проблема: mx_data.user_data.user_id та mx_data.user_contact.user_id
-- є NOT NULL FK → public."user"(id). Але клієнти, яких вносять
-- співробітники вручну, можуть не мати акаунту в системі.
--
-- Рішення:
-- 1. user_data.user_id → nullable (NULL = клієнт без акаунту)
-- 2. user_contact → додати user_data_id, зробити user_id nullable
-- 3. CHECK: або user_id, або user_data_id обов'язковий
-- 4. Оновити унікальний індекс is_default
-- 5. Оновити VIEW user_data_with_contact_view
-- 6. Оновити тригерні функції
-- 7. user_data_legal → додати FK до user_data
-- ======================================================
BEGIN;

-- ======================================================
-- 1. user_data.user_id → nullable
-- ======================================================
ALTER TABLE mx_data.user_data
  ALTER COLUMN user_id DROP NOT NULL;

-- ======================================================
-- 2. user_contact: додати user_data_id, user_id nullable
-- ======================================================
ALTER TABLE mx_data.user_contact
  ADD COLUMN IF NOT EXISTS user_data_id uuid
    REFERENCES mx_data.user_data(id) ON DELETE CASCADE;

ALTER TABLE mx_data.user_contact
  ALTER COLUMN user_id DROP NOT NULL;

-- ======================================================
-- 3. Constraint: обов'язковий або user_id, або user_data_id
-- ======================================================
ALTER TABLE mx_data.user_contact
  ADD CONSTRAINT user_contact_owner_check
    CHECK (user_id IS NOT NULL OR user_data_id IS NOT NULL);

-- ======================================================
-- 4. Індекс is_default: враховує обидва ключі
-- ======================================================
DROP INDEX IF EXISTS mx_data.user_contact_default_one_per_user_idx;

CREATE UNIQUE INDEX user_contact_default_one_per_user_idx
  ON mx_data.user_contact (COALESCE(user_id, user_data_id::text))
  WHERE is_default = TRUE;

-- ======================================================
-- 5. Оновити VIEW (підтримка клієнтів без user_id)
-- ======================================================
DROP VIEW IF EXISTS mx_data.user_data_with_contact_view;

CREATE OR REPLACE VIEW mx_data.user_data_with_contact_view AS
SELECT
  ud.id            AS user_data_id,
  ud.user_id,
  u.name           AS user_name,
  u.image          AS user_image,
  ud.full_name,
  ud.created_at,
  ud.updated_at,

  uc.contact_value,
  dct.code         AS contact_type_code,
  uc.contact_type_id,

  mx_data.fn_contact_build_url(dct.code, uc.contact_value) AS contact_url
FROM mx_data.user_data ud
    LEFT JOIN LATERAL (
      SELECT c.contact_value, c.contact_type_id
      FROM mx_data.user_contact c
      WHERE (ud.user_id IS NOT NULL AND c.user_id = ud.user_id)
         OR (ud.user_id IS NULL AND c.user_data_id = ud.id)
      ORDER BY c.is_default DESC, c.updated_at DESC
      LIMIT 1
    ) uc ON TRUE
    LEFT JOIN mx_dic.dic_contact_type dct ON dct.id = uc.contact_type_id
    LEFT JOIN public."user" u ON u.id = ud.user_id;

-- ======================================================
-- 6. Оновити тригерні функції для підтримки user_data_id
-- ======================================================

-- Перевірка цілісності: профіль має мати ≥1 контакт
DROP FUNCTION IF EXISTS mx_data.fn_check_user_data_has_contacts_aud() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_check_user_data_has_contacts_aud()
RETURNS trigger
LANGUAGE plpgsql
AS $$
/*
  ОПИС (UA):
  Якщо існує профіль у mx_data.user_data, наприкінці транзакції має
  існувати ≥1 контакт у mx_data.user_contact.
  Підтримує два режими:
  - Зареєстрований користувач: контакти зберігаються з user_id
  - Клієнт без акаунту: контакти зберігаються з user_data_id
*/
DECLARE
  v_user_id     text;
  v_user_data_id uuid;
  v_cnt         integer;
BEGIN
  -- Визначаємо, з якої таблиці прийшов тригер
  IF TG_TABLE_NAME = 'user_data' THEN
    v_user_id     := COALESCE(NEW.user_id, OLD.user_id);
    v_user_data_id := COALESCE(NEW.id, OLD.id);

    -- Якщо профіль відсутній — немає чого перевіряти
    IF NOT EXISTS (SELECT 1 FROM mx_data.user_data WHERE id = v_user_data_id) THEN
      RETURN NULL;
    END IF;

  ELSIF TG_TABLE_NAME = 'user_contact' THEN
    v_user_id     := COALESCE(NEW.user_id, OLD.user_id);
    v_user_data_id := COALESCE(NEW.user_data_id, OLD.user_data_id);

    -- Для зареєстрованого: перевіряємо профіль за user_id
    IF v_user_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM mx_data.user_data WHERE user_id = v_user_id) THEN
        RETURN NULL;
      END IF;
      SELECT ud.id INTO v_user_data_id
      FROM mx_data.user_data ud WHERE ud.user_id = v_user_id LIMIT 1;
    END IF;

    -- Для клієнта без акаунту: перевіряємо профіль за user_data_id
    IF v_user_data_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM mx_data.user_data WHERE id = v_user_data_id) THEN
        RETURN NULL;
      END IF;
    END IF;
  END IF;

  -- Підрахунок контактів для профілю
  SELECT COUNT(*) INTO v_cnt
  FROM mx_data.user_contact uc
  WHERE (v_user_id IS NOT NULL AND uc.user_id = v_user_id)
     OR (v_user_id IS NULL AND v_user_data_id IS NOT NULL AND uc.user_data_id = v_user_data_id);

  IF v_cnt < 1 THEN
    RAISE EXCEPTION 'Порушення цілісності: профіль (%) не має жодного контакту.', COALESCE(v_user_id, v_user_data_id::text)
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

-- Перестворюємо тригери
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

-- Тригер підтримки is_default (BEFORE UPDATE) — оновлений для user_data_id
DROP FUNCTION IF EXISTS mx_data.fn_user_contact_bu_maintain_default() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_user_contact_bu_maintain_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
/*
  ОПИС (UA):
  BEFORE UPDATE: якщо встановлюємо is_default=TRUE, спочатку знімаємо
  прапор з усіх інших контактів. Підтримує user_id і user_data_id.
*/
BEGIN
  IF NEW.is_default AND (OLD.is_default IS DISTINCT FROM NEW.is_default) THEN
    IF NEW.user_id IS NOT NULL THEN
      UPDATE mx_data.user_contact
      SET is_default = FALSE
      WHERE user_id = NEW.user_id AND id <> NEW.id AND is_default = TRUE;
    ELSIF NEW.user_data_id IS NOT NULL THEN
      UPDATE mx_data.user_contact
      SET is_default = FALSE
      WHERE user_data_id = NEW.user_data_id AND id <> NEW.id AND is_default = TRUE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_contact_bu_maintain_default ON mx_data.user_contact;
CREATE TRIGGER trg_user_contact_bu_maintain_default
BEFORE UPDATE ON mx_data.user_contact
FOR EACH ROW
EXECUTE FUNCTION mx_data.fn_user_contact_bu_maintain_default();

-- Тригер підтримки is_default (AFTER INSERT/DELETE) — оновлений для user_data_id
DROP FUNCTION IF EXISTS mx_data.fn_user_contact_aid_maintain_default() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_user_contact_aid_maintain_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
/*
  ОПИС (UA):
  AFTER INSERT/DELETE підтримує узгодженість is_default:
  - перший контакт → дефолтний;
  - якщо вставлений контакт дефолтний → скинути іншим;
  - при видаленні дефолтного → найсвіжіший стає дефолтним.
  Підтримує user_id (зареєстровані) і user_data_id (клієнти без акаунту).
*/
DECLARE
  v_has_others boolean;
  v_new_id     uuid;
  v_owner_id   text;   -- 'u:user_id' або 'd:user_data_id'
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Визначаємо «власника» контакту
    IF NEW.user_id IS NOT NULL THEN
      -- Зареєстрований користувач: перший контакт → дефолтний
      IF NOT EXISTS (SELECT 1 FROM mx_data.user_contact WHERE user_id = NEW.user_id AND id <> NEW.id) THEN
        IF NEW.is_default IS FALSE THEN
          UPDATE mx_data.user_contact SET is_default = TRUE WHERE id = NEW.id;
        END IF;
      END IF;

      IF NEW.is_default THEN
        UPDATE mx_data.user_contact
        SET is_default = FALSE
        WHERE user_id = NEW.user_id AND id <> NEW.id AND is_default IS TRUE;
      END IF;

    ELSIF NEW.user_data_id IS NOT NULL THEN
      -- Клієнт без акаунту: перший контакт → дефолтний
      IF NOT EXISTS (SELECT 1 FROM mx_data.user_contact WHERE user_data_id = NEW.user_data_id AND id <> NEW.id) THEN
        IF NEW.is_default IS FALSE THEN
          UPDATE mx_data.user_contact SET is_default = TRUE WHERE id = NEW.id;
        END IF;
      END IF;

      IF NEW.is_default THEN
        UPDATE mx_data.user_contact
        SET is_default = FALSE
        WHERE user_data_id = NEW.user_data_id AND id <> NEW.id AND is_default IS TRUE;
      END IF;
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_default THEN
      IF OLD.user_id IS NOT NULL THEN
        SELECT EXISTS (SELECT 1 FROM mx_data.user_contact WHERE user_id = OLD.user_id)
        INTO v_has_others;

        IF v_has_others THEN
          SELECT id INTO v_new_id
          FROM mx_data.user_contact
          WHERE user_id = OLD.user_id
          ORDER BY is_default DESC, updated_at DESC
          LIMIT 1;

          UPDATE mx_data.user_contact SET is_default = TRUE WHERE id = v_new_id;
        END IF;

      ELSIF OLD.user_data_id IS NOT NULL THEN
        SELECT EXISTS (SELECT 1 FROM mx_data.user_contact WHERE user_data_id = OLD.user_data_id)
        INTO v_has_others;

        IF v_has_others THEN
          SELECT id INTO v_new_id
          FROM mx_data.user_contact
          WHERE user_data_id = OLD.user_data_id
          ORDER BY is_default DESC, updated_at DESC
          LIMIT 1;

          UPDATE mx_data.user_contact SET is_default = TRUE WHERE id = v_new_id;
        END IF;
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

-- ======================================================
-- 7. user_data_legal: додати FK до user_data
-- ======================================================
ALTER TABLE mx_data.user_data_legal
  ADD CONSTRAINT IF NOT EXISTS user_data_legal_user_data_fk
    FOREIGN KEY (user_data_id)
    REFERENCES mx_data.user_data(id)
    ON DELETE CASCADE;

-- Додати індекс для user_data_id в user_contact (для клієнтів без акаунту)
CREATE INDEX IF NOT EXISTS user_contact_user_data_id_idx
  ON mx_data.user_contact (user_data_id);

COMMIT;
