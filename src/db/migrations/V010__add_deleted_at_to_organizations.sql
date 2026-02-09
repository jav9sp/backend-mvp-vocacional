BEGIN;

-- Agregar campo deleted_at a la tabla organizations para soft delete
ALTER TABLE organizations
  ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;

COMMIT;
