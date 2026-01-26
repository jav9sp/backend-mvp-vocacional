export type InapAreaKey =
  | "adm"
  | "agr"
  | "art"
  | "csn"
  | "soc"
  | "edu"
  | "ing"
  | "sal"
  | "seg"
  | "tec";

export type Career = {
  id: string;
  name: string;
  areaKey: InapAreaKey;
  level?: "universitario" | "tecnico";
};

export const CAREERS_MOCK: Career[] = [
  // adm
  { id: "adm-1", name: "Derecho", areaKey: "adm", level: "universitario" },
  {
    id: "adm-2",
    name: "Ingeniería Comercial / Administración",
    areaKey: "adm",
    level: "universitario",
  },
  {
    id: "adm-3",
    name: "Contabilidad y Auditoría",
    areaKey: "adm",
    level: "universitario",
  },
  {
    id: "adm-4",
    name: "Administración Pública",
    areaKey: "adm",
    level: "universitario",
  },
  {
    id: "adm-5",
    name: "Técnico en Administración",
    areaKey: "adm",
    level: "tecnico",
  },

  // agr
  {
    id: "agr-1",
    name: "Medicina Veterinaria",
    areaKey: "agr",
    level: "universitario",
  },
  {
    id: "agr-2",
    name: "Ingeniería Agronómica",
    areaKey: "agr",
    level: "universitario",
  },
  {
    id: "agr-3",
    name: "Ingeniería Forestal",
    areaKey: "agr",
    level: "universitario",
  },
  {
    id: "agr-4",
    name: "Biología Marina / Recursos Marinos",
    areaKey: "agr",
    level: "universitario",
  },
  {
    id: "agr-5",
    name: "Técnico Agropecuario",
    areaKey: "agr",
    level: "tecnico",
  },

  // art
  {
    id: "art-1",
    name: "Diseño Gráfico",
    areaKey: "art",
    level: "universitario",
  },
  { id: "art-2", name: "Arquitectura", areaKey: "art", level: "universitario" },
  { id: "art-3", name: "Música", areaKey: "art", level: "universitario" },
  {
    id: "art-4",
    name: "Literatura / Letras",
    areaKey: "art",
    level: "universitario",
  },
  { id: "art-5", name: "Técnico en Diseño", areaKey: "art", level: "tecnico" },

  // csn
  { id: "csn-1", name: "Biología", areaKey: "csn", level: "universitario" },
  { id: "csn-2", name: "Química", areaKey: "csn", level: "universitario" },
  { id: "csn-3", name: "Física", areaKey: "csn", level: "universitario" },
  { id: "csn-4", name: "Matemáticas", areaKey: "csn", level: "universitario" },
  {
    id: "csn-5",
    name: "Estadística / Ciencia de Datos",
    areaKey: "csn",
    level: "universitario",
  },

  // soc
  { id: "soc-1", name: "Periodismo", areaKey: "soc", level: "universitario" },
  { id: "soc-2", name: "Psicología", areaKey: "soc", level: "universitario" },
  { id: "soc-3", name: "Sociología", areaKey: "soc", level: "universitario" },
  {
    id: "soc-4",
    name: "Trabajo Social",
    areaKey: "soc",
    level: "universitario",
  },
  {
    id: "soc-5",
    name: "Ciencias Políticas",
    areaKey: "soc",
    level: "universitario",
  },

  // edu
  {
    id: "edu-1",
    name: "Pedagogía en Educación Básica",
    areaKey: "edu",
    level: "universitario",
  },
  {
    id: "edu-2",
    name: "Pedagogía en Matemática",
    areaKey: "edu",
    level: "universitario",
  },
  {
    id: "edu-3",
    name: "Pedagogía en Lenguaje",
    areaKey: "edu",
    level: "universitario",
  },
  {
    id: "edu-4",
    name: "Educación Parvularia",
    areaKey: "edu",
    level: "universitario",
  },
  {
    id: "edu-5",
    name: "Técnico en Educación Parvularia",
    areaKey: "edu",
    level: "tecnico",
  },

  // ing
  {
    id: "ing-1",
    name: "Ingeniería Civil",
    areaKey: "ing",
    level: "universitario",
  },
  {
    id: "ing-2",
    name: "Ingeniería Industrial",
    areaKey: "ing",
    level: "universitario",
  },
  {
    id: "ing-3",
    name: "Ingeniería Mecánica",
    areaKey: "ing",
    level: "universitario",
  },
  {
    id: "ing-4",
    name: "Ingeniería Eléctrica",
    areaKey: "ing",
    level: "universitario",
  },
  {
    id: "ing-5",
    name: "Técnico en Construcción",
    areaKey: "ing",
    level: "tecnico",
  },

  // sal
  { id: "sal-1", name: "Medicina", areaKey: "sal", level: "universitario" },
  { id: "sal-2", name: "Enfermería", areaKey: "sal", level: "universitario" },
  { id: "sal-3", name: "Kinesiología", areaKey: "sal", level: "universitario" },
  {
    id: "sal-4",
    name: "Nutrición y Dietética",
    areaKey: "sal",
    level: "universitario",
  },
  {
    id: "sal-5",
    name: "Técnico en Enfermería (TENS)",
    areaKey: "sal",
    level: "tecnico",
  },

  // seg
  {
    id: "seg-1",
    name: "Criminología / Criminalística",
    areaKey: "seg",
    level: "universitario",
  },
  { id: "seg-2", name: "Seguridad Privada", areaKey: "seg", level: "tecnico" },
  {
    id: "seg-3",
    name: "Prevención de Riesgos",
    areaKey: "seg",
    level: "universitario",
  },
  {
    id: "seg-4",
    name: "Servicio Social Comunitario",
    areaKey: "seg",
    level: "universitario",
  },
  {
    id: "seg-5",
    name: "Técnico en Emergencias",
    areaKey: "seg",
    level: "tecnico",
  },

  // tec
  {
    id: "tec-1",
    name: "Ingeniería en Informática",
    areaKey: "tec",
    level: "universitario",
  },
  {
    id: "tec-2",
    name: "Analista Programador",
    areaKey: "tec",
    level: "tecnico",
  },
  {
    id: "tec-3",
    name: "Ciberseguridad",
    areaKey: "tec",
    level: "universitario",
  },
  {
    id: "tec-4",
    name: "Ingeniería en Telecomunicaciones",
    areaKey: "tec",
    level: "universitario",
  },
  { id: "tec-5", name: "Técnico en Redes", areaKey: "tec", level: "tecnico" },
];
