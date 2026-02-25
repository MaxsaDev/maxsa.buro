-- updated_at на user_contact
DROP TRIGGER IF EXISTS trg_user_contact_bu_set_updated_at ON mx_data.user_contact;
CREATE TRIGGER trg_user_contact_bu_set_updated_at
BEFORE UPDATE ON mx_data.user_contact
FOR EACH ROW
EXECUTE FUNCTION mx_global.set_updated_at();

-- ======================================================
-- ВАЛІДАЦІЯ contact_value ЗАЛЕЖНО ВІД ТИПУ (словника)
-- ======================================================
DROP FUNCTION IF EXISTS mx_data.fn_user_contact_bi_validate() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_user_contact_bi_validate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
/*
  ОПИС (UA):
  Валідація значення контакту відповідно до типу зі словника.
  Викликається BEFORE INSERT/UPDATE для mx_data.user_contact.
  Мінімальна технічна валідація на БД-рівні; детальні правила — у бекенді (zod).
*/
DECLARE
  v_code text;
BEGIN
  -- Отримуємо машинний код типу зі словника
  SELECT d.code INTO v_code
  FROM mx_dic.dic_contact_type d
  WHERE d.id = COALESCE(NEW.contact_type_id, OLD.contact_type_id);

  IF v_code IS NULL THEN
    RAISE EXCEPTION 'Невідомий contact_type_id=%', NEW.contact_type_id;
  END IF;

  -- Заборона запису неактивного типу (захист на рівні БД)
  IF NOT EXISTS (
    SELECT 1 FROM mx_dic.dic_contact_type d
    WHERE d.id = NEW.contact_type_id AND d.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Тип контакту (% / id=%) деактивований', v_code, NEW.contact_type_id;
  END IF;

  -- Мінімальна нормалізація значення (обрізання пробілів)
  NEW.contact_value := btrim(NEW.contact_value);

  -- Валідація за кодом (спрощено)
  IF v_code = 'phone' THEN
    IF NEW.contact_value !~ '^\+?[1-9][0-9]{6,14}$' THEN
      RAISE EXCEPTION 'Некоректний номер телефону (очікується E.164-подібний формат)';
    END IF;

  ELSIF v_code = 'email' THEN
    IF NEW.contact_value !~ '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Некоректна адреса електронної пошти';
    END IF;

  ELSIF v_code = 'telegram' THEN
    -- Дозволяємо: номер телефону, @username, username, або посилання t.me/username
    IF NEW.contact_value !~ '^\+?[1-9][0-9]{6,14}$' AND
       NEW.contact_value !~ '^@?[A-Za-z0-9_]{5,}$' AND
       NEW.contact_value !~ '^(https?://)?(t\.me|telegram\.me)/[A-Za-z0-9_]+/?$' THEN
      RAISE EXCEPTION 'Некоректний формат Telegram (очікується: номер телефону, @username або t.me/username)';
    END IF;

  ELSIF v_code = 'facebook' THEN
    -- Дозволяємо: @username, username або повне посилання
    IF NEW.contact_value !~ '^(https?://(www\.|m\.|mbasic\.)?(facebook|fb)\.(com|me)/[A-Za-z0-9_.\-]+/?|@?[A-Za-z0-9_.\-]+)$' THEN
      RAISE EXCEPTION 'Некоректний Facebook username/URL';
    END IF;

  ELSIF v_code = 'instagram' THEN
    -- Дозволяємо: @username, username або повне посилання
    IF NEW.contact_value !~ '^(https?://(www\.)?instagram\.com/[A-Za-z0-9_.\-]+/?|@?[A-Za-z0-9_.\-]+)$' THEN
      RAISE EXCEPTION 'Некоректний Instagram username/URL';
    END IF;

  ELSIF v_code = 'messenger' THEN
    -- Дозволяємо: @username, username або повне посилання m.me
    IF NEW.contact_value !~ '^(https?://(www\.|m\.)?(messenger\.com/t|m\.me)/[A-Za-z0-9_.\-]+/?|@?[A-Za-z0-9_.\-]+)$' THEN
      RAISE EXCEPTION 'Некоректний Messenger username/URL';
    END IF;

  ELSIF v_code = 'viber' THEN
    -- Дозволяємо: номер телефону або посилання viber.com
    IF NEW.contact_value !~ '^\+?[1-9][0-9]{6,14}$' AND
       NEW.contact_value !~ '^(https?://)?(www\.)?viber\.com/[A-Za-z0-9_.\-]+/?$' THEN
      RAISE EXCEPTION 'Некоректний формат Viber (очікується: номер телефону або viber.com/username)';
    END IF;

  ELSIF v_code = 'whatsapp' THEN
    -- Дозволяємо: номер телефону або посилання wa.me
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

-- ======================================================
-- ПІДТРИМКА «РІВНО ОДИН ДЕФОЛТНИЙ» КОНТАКТ
-- Підтримує user_id (зареєстровані) і user_data_id (клієнти без акаунту)
-- ======================================================

-- BEFORE UPDATE: знімаємо is_default з інших контактів ДО перевірки unique index
DROP FUNCTION IF EXISTS mx_data.fn_user_contact_bu_maintain_default() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_user_contact_bu_maintain_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
/*
  ОПИС (UA):
  BEFORE UPDATE: якщо встановлюємо is_default=TRUE, спочатку знімаємо прапор з усіх інших контактів.
  Підтримує user_id і user_data_id.
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

-- AFTER INSERT/DELETE: підтримка дефолтного контакту при вставці та видаленні
DROP FUNCTION IF EXISTS mx_data.fn_user_contact_aid_maintain_default() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_user_contact_aid_maintain_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
/*
  ОПИС (UA):
  AFTER INSERT/DELETE підтримує узгодженість is_default для кожного власника:
  - перший контакт → дефолтний;
  - якщо вставлений контакт дефолтний → скинути іншим;
  - при видаленні дефолтного → найсвіжіший стає дефолтним.
  Рекурсія відсічена через pg_trigger_depth().
  Підтримує user_id (зареєстровані) і user_data_id (клієнти без акаунту).
*/
DECLARE
  v_has_others boolean;
  v_new_id     uuid;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id IS NOT NULL THEN
      -- Зареєстрований: перший контакт → дефолтний
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
