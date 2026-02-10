BEGIN;

ALTER TABLE inap_results
  ADD COLUMN IF NOT EXISTS top_areas_by_interes jsonb,
  ADD COLUMN IF NOT EXISTS top_areas_by_aptitud jsonb;

UPDATE inap_results
SET
  top_areas_by_interes = COALESCE(
    (
      SELECT jsonb_agg(s.area)
      FROM (
        SELECT
          e.key AS area,
          COALESCE((e.value ->> 'interes')::numeric, 0) AS interes,
          COALESCE((e.value ->> 'aptitud')::numeric, 0) AS aptitud
        FROM jsonb_each(COALESCE(inap_results.percent_by_area_dim, '{}'::jsonb)) AS e(key, value)
        ORDER BY interes DESC, aptitud DESC, area ASC
        LIMIT 3
      ) AS s
    ),
    '[]'::jsonb
  ),
  top_areas_by_aptitud = COALESCE(
    (
      SELECT jsonb_agg(s.area)
      FROM (
        SELECT
          e.key AS area,
          COALESCE((e.value ->> 'interes')::numeric, 0) AS interes,
          COALESCE((e.value ->> 'aptitud')::numeric, 0) AS aptitud
        FROM jsonb_each(COALESCE(inap_results.percent_by_area_dim, '{}'::jsonb)) AS e(key, value)
        ORDER BY aptitud DESC, interes DESC, area ASC
        LIMIT 3
      ) AS s
    ),
    '[]'::jsonb
  );

ALTER TABLE inap_results
  ALTER COLUMN top_areas_by_interes SET DEFAULT '[]'::jsonb,
  ALTER COLUMN top_areas_by_aptitud SET DEFAULT '[]'::jsonb;

UPDATE inap_results
SET
  top_areas_by_interes = COALESCE(top_areas_by_interes, '[]'::jsonb),
  top_areas_by_aptitud = COALESCE(top_areas_by_aptitud, '[]'::jsonb);

ALTER TABLE inap_results
  ALTER COLUMN top_areas_by_interes SET NOT NULL,
  ALTER COLUMN top_areas_by_aptitud SET NOT NULL;

ALTER TABLE inap_results
  DROP COLUMN IF EXISTS top_areas;

COMMIT;
