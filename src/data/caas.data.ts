export type CaasDimension = "preocupacion" | "control" | "curiosidad" | "confianza";

export const CAAS_DIMENSIONS = [
  { key: "preocupacion" as const, name: "Preocupación", color: "#3B82F6" },
  { key: "control" as const, name: "Control", color: "#10B981" },
  { key: "curiosidad" as const, name: "Curiosidad", color: "#F59E0B" },
  { key: "confianza" as const, name: "Confianza", color: "#8B5CF6" },
] as const;

export type CaasQuestion = {
  id: number;
  dimension: CaasDimension;
  text: string;
};

// 24 preguntas cerradas (6 por dimensión)
export const CAAS_CLOSED_QUESTIONS: CaasQuestion[] = [
  // Preocupación (1-6)
  { id: 1, dimension: "preocupacion", text: "Pensar sobre cómo será mi futuro." },
  { id: 2, dimension: "preocupacion", text: "Darme cuenta que las decisiones que tome hoy influyen en mi futuro." },
  { id: 3, dimension: "preocupacion", text: "Prepararme para el futuro." },
  { id: 4, dimension: "preocupacion", text: "Ser consciente de las elecciones educativas y vocacionales que debo tomar." },
  { id: 5, dimension: "preocupacion", text: "Planificar cómo voy a lograr mis objetivos/metas." },
  { id: 6, dimension: "preocupacion", text: "Preocuparme por lo que haré saliendo de cuarto medio." },

  // Control (7-12)
  { id: 7, dimension: "control", text: "Tomar decisiones por mí mismo." },
  { id: 8, dimension: "control", text: "Responsabilizarme de mis acciones." },
  { id: 9, dimension: "control", text: "Defender mis creencias (convicciones)." },
  { id: 10, dimension: "control", text: "Hacer lo que creo que está bien." },
  { id: 11, dimension: "control", text: "Realizar las tareas de manera correcta en poco tiempo." },
  { id: 12, dimension: "control", text: "Tener cuidado de hacer las cosas bien." },

  // Curiosidad (13-18)
  { id: 13, dimension: "curiosidad", text: "Explorar mi entorno." },
  { id: 14, dimension: "curiosidad", text: "Buscar oportunidades para crecer como persona." },
  { id: 15, dimension: "curiosidad", text: "Explorar opciones antes de tomar una decisión." },
  { id: 16, dimension: "curiosidad", text: "Considerar diferentes maneras de hacer las cosas." },
  { id: 17, dimension: "curiosidad", text: "Reflexionar sobre mis dudas." },
  { id: 18, dimension: "curiosidad", text: "Tener curiosidad sobre nuevas oportunidades." },

  // Confianza (19-24)
  { id: 19, dimension: "confianza", text: "Ser optimista." },
  { id: 20, dimension: "confianza", text: "Confiar en mí mismo." },
  { id: 21, dimension: "confianza", text: "Aprender nuevas habilidades." },
  { id: 22, dimension: "confianza", text: "Desarrollar al máximo mis capacidades." },
  { id: 23, dimension: "confianza", text: "Superar obstáculos." },
  { id: 24, dimension: "confianza", text: "Resolver problemas." },
];

export const CAAS_OPEN_QUESTIONS = [
  {
    key: "future_vision" as const,
    text: "¿Qué te imaginas haciendo después de salir de cuarto medio?",
    order: 1,
  },
  {
    key: "doubts" as const,
    text: "¿Qué cosas te cuesta decidir o no tienes claras sobre tu futuro?",
    order: 2,
  },
  {
    key: "curiosities" as const,
    text: "¿Qué cosas te dan curiosidad o te gustaría conocer más para elegir bien tu camino?",
    order: 3,
  },
];

export const CAAS_SCALE_LABELS = {
  1: "Muy débil",
  2: "Débil",
  3: "Fuerte",
  4: "Muy fuerte",
  5: "Más fuerte",
} as const;
