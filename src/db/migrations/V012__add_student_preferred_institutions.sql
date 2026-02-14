BEGIN;

CREATE TABLE student_preferred_institution (
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution_id  INTEGER NOT NULL REFERENCES institution(institution_id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, institution_id)
);

CREATE INDEX idx_student_pref_inst_user ON student_preferred_institution(user_id);

COMMIT;