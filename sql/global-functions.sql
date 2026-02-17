CREATE SCHEMA IF NOT EXISTS mx_global;

CREATE OR REPLACE FUNCTION mx_global.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$;
