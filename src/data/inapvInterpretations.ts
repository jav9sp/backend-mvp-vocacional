export const INAPV_GENERAL_EXPLANATION = {
  interes:
    "El interés muestra qué tanto te atraen o motivan las actividades típicas de cada área. Un porcentaje alto sugiere que ese tipo de temas o tareas te llaman la atención y podrías disfrutarlos.",
  aptitud:
    "La aptitud muestra qué tan capaz te sientes o qué tan bien se te dan las actividades típicas de cada área. Un porcentaje alto sugiere facilidad, habilidades o confianza para desempeñarte ahí.",
  combined:
    "Interés y aptitud no siempre coinciden. Lo ideal es mirar ambos como una guía para explorar, junto con tus valores, metas y experiencias.",
};

export type AreaInterpretation = {
  interes: { high: string };
  aptitud: { high: string };
};

export const INAPV_AREA_INTERPRETATIONS: Record<string, AreaInterpretation> = {
  adm: {
    interes: {
      high: `Muestras un alto interés por actividades relacionadas con la gestión, la organización y la toma de decisiones.
Es probable que te motive planificar, liderar equipos, analizar situaciones y comprender cómo funcionan las organizaciones y las normas.`,
    },
    aptitud: {
      high: `Presentas una buena aptitud para tareas administrativas y legales, lo que sugiere habilidades para el razonamiento lógico, la organización y el análisis de información.`,
    },
  },

  agr: {
    interes: {
      high: `Te interesa trabajar en contacto con la naturaleza, los seres vivos y los procesos productivos del entorno natural.
Es probable que disfrutes actividades relacionadas con el cuidado, la producción y la sostenibilidad.`,
    },
    aptitud: {
      high: `Muestras aptitud para actividades prácticas y técnicas vinculadas al entorno natural, lo que indica capacidad para observar, aplicar procedimientos y trabajar de manera constante.`,
    },
  },

  art: {
    interes: {
      high: `Manifiestas un alto interés por la expresión creativa, la reflexión cultural y las manifestaciones artísticas y humanísticas.
Es probable que disfrutes crear, interpretar ideas y explorar distintas formas de expresión.`,
    },
    aptitud: {
      high: `Presentas habilidades para el pensamiento creativo, la sensibilidad estética y la interpretación de contenidos culturales y simbólicos.`,
    },
  },

  csn: {
    interes: {
      high: `Te interesa comprender cómo funciona el mundo desde una perspectiva científica y analítica.
Es probable que disfrutes investigar, formular preguntas, analizar datos y buscar explicaciones basadas en evidencias.`,
    },
    aptitud: {
      high: `Muestras aptitud para el razonamiento lógico, matemático y científico, lo que indica facilidad para analizar información y resolver problemas abstractos.`,
    },
  },

  soc: {
    interes: {
      high: `Muestras interés por comprender la sociedad, la comunicación y las dinámicas sociales.
Es probable que te motive analizar la realidad social, informar, investigar y participar en procesos comunicativos.`,
    },
    aptitud: {
      high: `Presentas habilidades para el análisis social, la comunicación escrita u oral y la comprensión de contextos sociales y culturales.`,
    },
  },

  edu: {
    interes: {
      high: `Te interesa el aprendizaje, la enseñanza y el desarrollo de otras personas.
Es probable que disfrutes explicar, acompañar procesos formativos y contribuir al crecimiento personal y académico de otros.`,
    },
    aptitud: {
      high: `Muestras aptitud para comunicar ideas, organizar contenidos y relacionarte con personas, habilidades clave en el ámbito educativo.`,
    },
  },

  ing: {
    interes: {
      high: `Te interesa trabajar con sistemas, estructuras, procesos técnicos y soluciones prácticas.
Es probable que disfrutes diseñar, construir, mejorar y resolver problemas concretos.`,
    },
    aptitud: {
      high: `Presentas habilidades para el pensamiento lógico, el análisis técnico y la resolución de problemas complejos, fundamentales en áreas de ingeniería.`,
    },
  },

  sal: {
    interes: {
      high: `Muestras interés por el bienestar, la salud y el cuidado de las personas.
Es probable que te motive ayudar, acompañar y contribuir a mejorar la calidad de vida de otros.`,
    },
    aptitud: {
      high: `Presentas aptitud para trabajar con personas, comprender situaciones humanas y aplicar conocimientos relacionados con la salud y el bienestar.`,
    },
  },

  seg: {
    interes: {
      high: `Te interesa mantener el orden, la seguridad y el servicio a la comunidad.
Es probable que te motive proteger, apoyar y responder a necesidades prácticas de las personas.`,
    },
    aptitud: {
      high: `Muestras aptitud para actuar con responsabilidad, disciplina y compromiso, habilidades importantes en servicios de seguridad y atención personal.`,
    },
  },

  tec: {
    interes: {
      high: `Muestras un alto interés por la tecnología, los sistemas digitales y la innovación.
Es probable que disfrutes trabajar con computadores, software, redes y soluciones tecnológicas.`,
    },
    aptitud: {
      high: `Presentas habilidades para el razonamiento lógico, la resolución de problemas tecnológicos y el aprendizaje de herramientas digitales.`,
    },
  },
};

export const FINAL_CONSIDERATIONS = `
Este informe no entrega una respuesta única ni definitiva sobre qué estudiar.
Sus resultados deben entenderse como una **herramienta de orientación**, que ayuda a identificar áreas donde actualmente presentas mayor interés y/o aptitud.

Es normal que tus intereses cambien con el tiempo y que algunas habilidades se desarrollen con la experiencia.
Por eso, se recomienda complementar estos resultados con:
- exploración de distintas carreras e instituciones,
- revisión de mallas curriculares,
- conversaciones con profesionales y estudiantes,
- y reflexión personal sobre tus metas, valores y contexto.

La decisión vocacional es un proceso, no un evento puntual.
`;

export const INTEREST_LINKS = [
  {
    label: "Mi Futuro",
    url: "https://www.mifuturo.cl",
    description:
      "Información oficial sobre carreras, instituciones, empleabilidad e ingresos.",
  },
  {
    label: "Beneficios Estudiantiles",
    url: "https://www.beneficiosestudiantiles.cl",
    description:
      "Becas, créditos y gratuidad del sistema de educación superior.",
  },
  {
    label: "DEMRE",
    url: "https://demre.cl",
    description:
      "Información sobre el sistema de acceso a la educación superior.",
  },
];
