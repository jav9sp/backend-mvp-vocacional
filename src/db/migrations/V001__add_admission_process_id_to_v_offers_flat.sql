DROP VIEW IF EXISTS v_offers_flat CASCADE;

CREATE VIEW v_offers_flat AS
WITH quota_pivot AS (
  SELECT
    oq.admission_process_id,
    oq.demre_code,

    MAX(CASE WHEN qt.code='REGULAR' AND it.code='ALL' THEN oq.quota_value END) AS quota_all,
    MAX(CASE WHEN qt.code='REGULAR' AND it.code='S1'  THEN oq.quota_value END) AS quota_s1,
    MAX(CASE WHEN qt.code='REGULAR' AND it.code='S2'  THEN oq.quota_value END) AS quota_s2,

    MAX(CASE WHEN qt.code='MC'   AND it.code='ALL' THEN oq.quota_value END) AS quota_mc,
    MAX(CASE WHEN qt.code='BEA'  AND it.code='ALL' THEN oq.quota_value END) AS quota_bea,
    MAX(CASE WHEN qt.code='PACE' AND it.code='ALL' THEN oq.quota_value END) AS quota_pace
  FROM offer_quota oq
  JOIN quota_type qt ON qt.quota_type_id = oq.quota_type_id
  JOIN intake it ON it.intake_id = oq.intake_id
  GROUP BY oq.admission_process_id, oq.demre_code
),
weight_pivot AS (
  SELECT
    ow.admission_process_id,
    ow.demre_code,

    MAX(CASE WHEN comp.code='NEM'     THEN ow.weight_percent END) AS nem,
    MAX(CASE WHEN comp.code='RANKING' THEN ow.weight_percent END) AS ranking,
    MAX(CASE WHEN comp.code='CL'      THEN ow.weight_percent END) AS cl,
    MAX(CASE WHEN comp.code='M1'      THEN ow.weight_percent END) AS m1,
    MAX(CASE WHEN comp.code='HIST'    THEN ow.weight_percent END) AS historia,
    MAX(CASE WHEN comp.code='CIEN'    THEN ow.weight_percent END) AS ciencias,
    MAX(CASE WHEN comp.code='M2'      THEN ow.weight_percent END) AS m2
  FROM offer_component_weight ow
  JOIN component comp ON comp.component_id = ow.component_id
  GROUP BY ow.admission_process_id, ow.demre_code
)
SELECT
  (ap.year::text || '-' || po.demre_code::text) AS offer_key,

  po.admission_process_id,

  ap.year,
  po.demre_code,

  po.institution_id,
  i.name AS institution_name,
  i.is_pace AS institution_is_pace,
  i.has_gratuity AS institution_has_gratuity,
  i.url AS institution_url,

  po.career_id,
  c.name AS career,

  po.location_id,
  l.name AS location_name,

  po.min_pond,
  po.min_prom_pond,
  po.cut_score,

  po.has_special_test,
  po.has_special_peda,

  qp.quota_all,
  qp.quota_s1,
  qp.quota_s2,
  qp.quota_mc,
  qp.quota_bea,
  qp.quota_pace,

  wp.nem,
  wp.ranking,
  wp.cl,
  wp.m1,
  wp.historia,
  wp.ciencias,
  wp.m2

FROM program_offer po
JOIN admission_process ap
  ON ap.admission_process_id = po.admission_process_id
JOIN institution i
  ON i.institution_id = po.institution_id
JOIN career c
  ON c.career_id = po.career_id
JOIN location l
  ON l.location_id = po.location_id
LEFT JOIN quota_pivot qp
  ON qp.admission_process_id = po.admission_process_id
 AND qp.demre_code = po.demre_code
LEFT JOIN weight_pivot wp
  ON wp.admission_process_id = po.admission_process_id
 AND wp.demre_code = po.demre_code;
