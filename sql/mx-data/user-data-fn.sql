-- updated_at на user_data
DROP TRIGGER IF EXISTS trg_user_data_bu_set_updated_at ON mx_data.user_data;
CREATE TRIGGER trg_user_data_bu_set_updated_at
BEFORE UPDATE ON mx_data.user_data
FOR EACH ROW
EXECUTE FUNCTION mx_global.set_updated_at();

-- ======================================================
-- ІНТЕГРИТІ: «ПРОФІЛЬ МАЄ МАТИ МІНІМУМ 1 КОНТАКТ»
-- DEFERRABLE INITIALLY DEFERRED → перевірка наприкінці транзакції
-- ======================================================
DROP FUNCTION IF EXISTS mx_data.fn_check_user_data_has_contacts_aud() CASCADE;
CREATE OR REPLACE FUNCTION mx_data.fn_check_user_data_has_contacts_aud()
RETURNS trigger
LANGUAGE plpgsql
AS $$
/*
  ОПИС (UA):
  Якщо існує профіль у mx_data.user_data для user_id, наприкінці транзакції має
  існувати ≥1 контакт у mx_data.user_contact. Захищає від «висячих» профілів/контактів.
*/
DECLARE
  v_user_id text;
  v_cnt     integer;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Якщо профіль відсутній — немає чого перевіряти
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

-- Constraint-тригери на обидві таблиці
DROP TRIGGER IF EXISTS trg_user_data_aud_has_contact    ON mx_data.user_data;
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


-- ======================================================
-- УТИЛІТА ПОБУДОВИ URL: fn_contact_build_url(code, value)
-- ======================================================

DROP FUNCTION IF EXISTS mx_data.fn_contact_build_url(text, citext);
CREATE OR REPLACE FUNCTION mx_data.fn_contact_build_url(p_code text, p_value citext)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
/*
  ОПИС (UA):
  Будує клікабельний URL для contact_value залежно від contact_type (code).
  Правила:
  - phone:    tel:+380... (нормалізуємо до E.164: лишаємо + та цифри; якщо + відсутній, додаємо)
  - email:    mailto:user@example.com
  - telegram: https://t.me/username  (якщо value починається з @ або вже https://t.me/, приводимо до username)
  - viber:    viber://add?number=+380...  (E.164 з +)
  - whatsapp: https://wa.me/380... (тільки цифри, без +)
  - facebook: якщо value вже http(s) — повертаємо як є; інакше https://facebook.com/value
  - instagram: аналогічно facebook
  - messenger: якщо http(s) — як є; інакше https://m.me/value
*/
DECLARE
  v text := trim(both from p_value::text);
  v_digits text;
  v_user   text;
BEGIN
  IF p_code IS NULL OR v = '' THEN
    RETURN NULL;
  END IF;

  IF p_code = 'phone' THEN
    -- лишаємо лише + та цифри
    v := regexp_replace(v, '[^0-9+]', '', 'g');
    IF v !~ '^\+' THEN
      -- якщо немає '+', просто додамо (очікуємо, що бекенд уже перевірив валідність)
      v := '+' || regexp_replace(v, '[^0-9]', '', 'g');
    END IF;
    RETURN 'tel:' || v;

  ELSIF p_code = 'email' THEN
    RETURN 'mailto:' || lower(v);

  ELSIF p_code = 'telegram' THEN
    -- зрізаємо протокол/хости до username
    v := regexp_replace(v, '^https?://(www\.)?t\.me/', '', 'i');
    v := regexp_replace(v, '^@', '');
    RETURN 'https://t.me/' || v;

  ELSIF p_code = 'viber' THEN
    -- потребує E.164 із плюсом
    v := regexp_replace(v, '[^0-9+]', '', 'g');
    IF v !~ '^\+' THEN
      v := '+' || regexp_replace(v, '[^0-9]', '', 'g');
    END IF;
    RETURN 'viber://add?number=' || v;

  ELSIF p_code = 'whatsapp' THEN
    -- wa.me приймає ТІЛЬКИ цифри
    v_digits := regexp_replace(v, '[^0-9]', '', 'g');
    RETURN 'https://wa.me/' || v_digits;

  ELSIF p_code = 'facebook' THEN
    IF v ~* '^https?://' THEN
      RETURN v; -- вже повний URL
    END IF;
    RETURN 'https://facebook.com/' || v;

  ELSIF p_code = 'instagram' THEN
    IF v ~* '^https?://' THEN
      RETURN v;
    END IF;
    -- зрізаємо протокол/хости до username
    v := regexp_replace(v, '^https?://(www\.)?instagram\.com/', '', 'i');
    v := regexp_replace(v, '^@', ''); -- видаляємо ведучий @
    RETURN 'https://instagram.com/' || v;

  ELSIF p_code = 'messenger' THEN
    IF v ~* '^https?://' THEN
      RETURN v;
    END IF;
    RETURN 'https://m.me/' || v;

  ELSE
    -- Фолбек: якщо у словнику є url_prefix — використаємо; інакше повертаємо як є
    RETURN COALESCE(
      (SELECT url_prefix FROM mx_dic.dic_contact_type WHERE code = p_code LIMIT 1),
      ''
    ) || v;
  END IF;
END;
$$;
