BEGIN;

-- 1) Tabla de favoritos por estudiante
CREATE TABLE IF NOT EXISTS student_favorite_offer (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admission_process_id INTEGER NOT NULL,
  demre_code INTEGER NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, admission_process_id, demre_code),

  FOREIGN KEY (admission_process_id, demre_code)
    REFERENCES program_offer(admission_process_id, demre_code)
    ON DELETE CASCADE
);

-- 2) Índices útiles (sobre todo para listar favoritos del user)
CREATE INDEX IF NOT EXISTS idx_fav_user
  ON student_favorite_offer(user_id);

CREATE INDEX IF NOT EXISTS idx_fav_offer
  ON student_favorite_offer(admission_process_id, demre_code);

COMMIT;