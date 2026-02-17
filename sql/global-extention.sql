-- ================================
-- ПІДГОТОВКА СЕРЕДОВИЩА
-- ================================

-- Розширення для case-insensitive тексту
CREATE EXTENSION IF NOT EXISTS citext;
-- Розширення для UUID генерації
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()
-- Розширення для UUID генерації (не використовується в проекті)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- id uuid DEFAULT uuid_generate_v4()
-- Розширення для JSONB
CREATE EXTENSION IF NOT EXISTS jsonb;
