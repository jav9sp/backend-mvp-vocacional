BEGIN;

CREATE TABLE IF NOT EXISTS vocational_area (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO vocational_area (key, name) VALUES
('adm', 'Administración de Empresas y Derecho'),
('agr', 'Agricultura, Silvicultura, Pesca y Veterinaria'),
('art', 'Artes y Humanidades'),
('csn', 'Ciencias Naturales, Matemática y Estadística'),
('soc', 'Ciencias Sociales, Periodismo e Información'),
('edu', 'Educación'),
('ing', 'Ingeniería, Industria y Construcción'),
('sal', 'Salud y Bienestar'),
('seg', 'Servicios de Seguridad y Personales'),
('tec', 'Tecnologías de la Información y Comunicación')
ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name;

COMMIT;