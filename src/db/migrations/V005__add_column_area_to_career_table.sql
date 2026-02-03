BEGIN;

ALTER TABLE career
ADD COLUMN IF NOT EXISTS vocational_area_key TEXT
REFERENCES vocational_area(key) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'career_vocational_area_fk'
  ) THEN
    ALTER TABLE career
      ADD CONSTRAINT career_vocational_area_fk
      FOREIGN KEY (vocational_area_key)
      REFERENCES vocational_area(key)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_career_vocational_area
ON career(vocational_area_key);

COMMIT;