CREATE OR REPLACE VIEW v_student_favorite_offers AS
SELECT
  f.user_id,
  f.created_at AS favorited_at,

  v.offer_key,
  v.year,
  v.demre_code,

  v.institution_id,
  v.institution_name,
  v.institution_is_pace,
  v.institution_has_gratuity,
  v.institution_url,

  v.career_id,
  v.career,

  v.location_id,
  v.location_name,

  v.min_pond,
  v.min_prom_pond,
  v.cut_score,

  v.has_special_test,
  v.has_special_peda,

  v.quota_all,
  v.quota_s1,
  v.quota_s2,
  v.quota_mc,
  v.quota_bea,
  v.quota_pace,

  v.nem,
  v.ranking,
  v.cl,
  v.m1,
  v.historia,
  v.ciencias,
  v.m2

FROM student_favorite_offer f
JOIN program_offer po
  ON po.admission_process_id = f.admission_process_id
 AND po.demre_code = f.demre_code
JOIN admission_process ap
  ON ap.admission_process_id = po.admission_process_id
JOIN v_offers_flat v
  ON v.year = ap.year
 AND v.demre_code = po.demre_code;