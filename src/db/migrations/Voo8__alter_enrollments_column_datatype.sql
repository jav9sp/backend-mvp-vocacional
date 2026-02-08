BEGIN;

ALTER TABLE enrollments
ALTER COLUMN meta TYPE jsonb
USING meta::jsonb;

CREATE INDEX IF NOT EXISTS enrollments_meta_gin
ON enrollments
USING GIN (meta);

COMMIT;