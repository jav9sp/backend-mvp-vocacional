BEGIN;

-- 1) Cambiar constraint del role
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin','student','superadmin'));

COMMIT;