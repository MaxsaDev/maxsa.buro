-- ======================================================
-- СЛОВНИК ТИПІВ КОНТАКТІВ
-- ======================================================
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS mx_dic;

-- ======================================================
-- СЛОВНИК ТИПІВ КОНТАКТІВ
-- ======================================================
DROP TABLE IF EXISTS mx_dic.dic_contact_type CASCADE;
CREATE TABLE IF NOT EXISTS mx_dic.dic_contact_type (
  id          smallserial PRIMARY KEY,           -- компактний FK
  code        text NOT NULL UNIQUE,              -- машинний код: 'phone','email','telegram',...
  title       text NOT NULL,                     -- локалізована назва (основна, українська)
  url_prefix  text,                              -- префікс URL (tel:, mailto:, https:// тощо)
  title_en    text,                              -- підпис в UI (англ), можна лишати NULL
  icon        text,                              -- ім’я іконки або URL (опційно)
  sort_order  int  NOT NULL DEFAULT 100,         -- порядок у селектах
  is_active   boolean NOT NULL DEFAULT true,     -- м’яка деактивація без видалення
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE mx_dic.dic_contact_type IS
'Словник каналів зв’язку з метаданими (назва, іконка, URL-префікс, активність).';

-- Початкове наповнення (ідемпотентне)
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
