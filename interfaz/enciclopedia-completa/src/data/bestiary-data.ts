import refEgg from "@/assets/creature-egg.jpg";
import refAdult from "@/assets/creature-main.jpg";
import refWorld from "@/assets/creature-world.jpg";
import refCore from "@/assets/creature-core.jpg";
import refEvolution from "@/assets/creature-evolution.jpg";
import refWounded from "@/assets/creature-main.jpg";

export type Stage = {
  id: string;
  cn: string;
  label: string;
  subtitle: string;
  chapter: string;
  description: string;
  plate: string;          // full ref plate
  accent: string;         // accent oklch
  threat: string;
  rank: string;
};

export const stages: Stage[] = [
  {
    id: "egg",
    cn: "GÉNESIS OMEGA",
    label: "Huevo Devorador",
    subtitle: "Génesis · Forma latente",
    chapter: "第一章 · CAP I",
    description:
      "Huevo elipsoidal de doce metros de diámetro, cubierto por cáscara negra como obsidiana atravesada por vetas doradas de origen desconocido. Su superficie es anormalmente densa y resistente al armamento nuclear, conservando intacto el núcleo durmiente que vibra en su interior.",
    plate: refEgg,
    accent: "oklch(0.72 0.18 55)",
    threat: "Ω · Latente",
    rank: "Rango 0",
  },
  {
    id: "adult",
    cn: "DEVORADOR ESTELAR",
    label: "Bestia del Cuerno Dorado",
    subtitle: "Forma adulta · Devorador estelar",
    chapter: "第二章 · CAP II",
    description:
      "Apodado «Tun Shi Shou». Su verdadero nombre tabú apenas se susurra en el cosmos. Pertenece al antiguo linaje de las Bestias del Vacío Estelar, con sangre cósmica desde el nacimiento. De naturaleza brutal y voraz, despierta temor en toda forma de vida consciente.",
    plate: refAdult,
    accent: "oklch(0.78 0.13 80)",
    threat: "Ω · Catastrófica",
    rank: "Rango VII",
  },
  {
    id: "core",
    cn: "NÚCLEO CRISTALINO",
    label: "Núcleo Original",
    subtitle: "Corazón cristalino · Fuente de poder",
    chapter: "第三章 · CAP III",
    description:
      "Esfera transparente de unos veinte centímetros de diámetro que irradia luz dorada en el interior del cuerpo. Sobre el cristal corren patrones secretos áureos de complejidad inabarcable; es el verdadero centro de existencia de la criatura.",
    plate: refCore,
    accent: "oklch(0.7 0.22 310)",
    threat: "Ω · Crítica",
    rank: "Singularidad",
  },
  {
    id: "world",
    cn: "MUNDO DIMENSIONAL",
    label: "Mundo Interior",
    subtitle: "Dimensión envuelta en niebla dorada",
    chapter: "第四章 · CAP IV",
    description:
      "El vasto espacio contenido dentro del núcleo original alberga un continente envuelto en bruma dorada. Su extensión se expande conforme aumenta el nivel del huésped, sirviendo como morada de las consciencias secundarias del soberano.",
    plate: refWorld,
    accent: "oklch(0.68 0.16 25)",
    threat: "Δ · Dimensional",
    rank: "Espacio propio",
  },
  {
    id: "evolution",
    cn: "EVOLUCIÓN MÁXIMA",
    label: "Estelar · Rango Séptimo",
    subtitle: "Forma evolucionada · Soberano alado",
    chapter: "第五章 · CAP V",
    description:
      "Gracias a su sangre primigenia, la Bestia evolucionó en breve tiempo hasta el séptimo rango estelar. En esta forma puede enfrentarse a humanos del noveno rango estelar, dos niveles por encima del suyo, con poder de combate apabullante.",
    plate: refEvolution,
    accent: "oklch(0.62 0.14 230)",
    threat: "Ω+ · Apex",
    rank: "Estelar VII",
  },
  {
    id: "wounded",
    cn: "HERIDA NUCLEAR",
    label: "Vientre Herido",
    subtitle: "Forma dañada · Cicatriz nuclear",
    chapter: "第六章 · CAP VI",
    description:
      "La humanidad detonó cientos de millones de toneladas equivalentes en bombas de hidrógeno alrededor de la Bestia. La fuerza extrema de la explosión abrió una herida monumental en su vientre, dejando expuesto el sello de su núcleo durante un instante irrepetible.",
    plate: refWounded,
    accent: "oklch(0.55 0.2 25)",
    threat: "Ω · Herida abierta",
    rank: "Vulnerable",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DOSSIER — every section is its own page (drawer-style), not one long scroll
// ─────────────────────────────────────────────────────────────────────────────

export type DossierSection = {
  id: string;
  numeral: string;
  title: string;
  cn: string;
  summary: string;
  fields: Record<string, string>;
};

export const dossierSections: DossierSection[] = [
  {
    id: "identity",
    numeral: "I",
    title: "Identidad",
    cn: "身份",
    summary: "Nombres, títulos y emblema heráldico del soberano.",
    fields: {
      "Nombre común": "Bestia del Cuerno Dorado",
      "Nombre ancestral": "Tun Shi Shou · 吞噬兽",
      "Nombre científico": "Stellaris voracis aurelius",
      "Nombres regionales": "Devorador · Coronado del Vacío · Astro Negro",
      "Título": "Soberano del Cuerno Dorado",
      "Emblema": "Dos cuernos curvos de oro sobre disco negro",
    },
  },
  {
    id: "classification",
    numeral: "II",
    title: "Clasificación Natural",
    cn: "分类",
    summary: "Reino, dominio y linaje cósmico de origen.",
    fields: {
      Reino: "Animalia Cosmica",
      Dominio: "Vacuum Stellaris",
      Clase: "Bestia del Vacío Estelar",
      Familia: "Devoradores Primigenios",
      Especie: "Aurelius giganteum",
      Linaje: "Bestias del cosmos antiguo",
      Origen: "Cosmos primordial · Era anterior al registro",
    },
  },
  {
    id: "power",
    numeral: "III",
    title: "Rango de Poder",
    cn: "等级",
    summary: "Nivel de existencia, rareza y potencial evolutivo.",
    fields: {
      "Rango de existencia": "Nivel XI · Cósmico Superior",
      "Nivel actual": "Estelar · Rango VII",
      Rareza: "Única",
      Antigüedad: "Eras incalculables",
      "Potencial evolutivo": "Eterno (sin límite confirmado)",
    },
  },
  {
    id: "threat",
    numeral: "IV",
    title: "Nivel de Amenaza",
    cn: "威胁",
    summary: "Clasificación de peligro y área de afectación.",
    fields: {
      "Clase de amenaza": "Ω · Catastrófica Cósmica",
      Nivel: "Máximo absoluto",
      "Motivo": "Capacidad de devorar planetas y civilizaciones",
      "Peligro principal": "Aniquilación masiva por absorción de materia",
      "Área afectada": "Sistemas planetarios completos",
    },
  },
  {
    id: "physical",
    numeral: "V",
    title: "Información Física",
    cn: "体征",
    summary: "Dimensiones, peso y rasgos distintivos.",
    fields: {
      Altura: "≈ 800 metros (forma adulta)",
      Longitud: "≈ 1.200 metros",
      Peso: "≈ 4.000 millones de toneladas",
      Apariencia: "Bípedo monumental de aspecto demoníaco-arcano",
      Coloración: "Negro obsidiana con vetas doradas incandescentes",
      "Rasgos distintivos": "Cuernos dorados · ojos áureos · núcleo visible",
    },
  },
  {
    id: "anatomy",
    numeral: "VI",
    title: "Anatomía",
    cn: "解剖",
    summary: "Estructura corporal, órganos especiales y debilidades.",
    fields: {
      "Estructura": "Esqueleto mineralizado cósmico, exo-armadura natural",
      "Órganos especiales": "Núcleo original · cámara devoradora · mundo interior",
      "Órgano mágico": "Núcleo cristalino — fuente y archivo de toda su esencia",
      Adaptaciones: "Supervivencia en vacío, resistencia a temperaturas extremas",
      "Defensas": "Armadura obsidiana, regeneración acelerada",
      Debilidades: "Núcleo expuesto durante el devorado · vientre vulnerable",
    },
  },
  {
    id: "energy",
    numeral: "VII",
    title: "Energía y Magia",
    cn: "能量",
    summary: "Fuente de poder, afinidad elemental y habilidades únicas.",
    fields: {
      "Fuente": "Devorado de masa cósmica y energía estelar",
      Afinidad: "Vacío · Oscuridad · Oro",
      "Tipo": "Magia devoradora dimensional",
      "Poder mágico": "Cósmico clase Ω",
      Capacidades: "Absorción dimensional · generación de mundos internos",
      "Habilidades únicas": "Devorado planetario · creación de espacio propio",
    },
  },
  {
    id: "behavior",
    numeral: "VIII",
    title: "Comportamiento",
    cn: "行为",
    summary: "Inteligencia, personalidad y hábitos.",
    fields: {
      Inteligencia: "Superior — consciencia cósmica",
      Personalidad: "Brutal · voraz · calculadora",
      Conducta: "Devoradora · territorial a escala estelar",
      Comunicación: "Telepatía cósmica · rugidos de baja frecuencia",
      Hábitos: "Hibernación de larga duración · despertar para devorar",
      Sociabilidad: "Solitaria · soberana absoluta",
    },
  },
  {
    id: "ecology",
    numeral: "IX",
    title: "Hábitat",
    cn: "栖息地",
    summary: "Distribución, clima y rol ecológico.",
    fields: {
      Hábitat: "Vacío estelar profundo · planetas en fase terminal",
      Región: "Borde de sistemas estelares colapsados",
      Distribución: "Extremadamente rara — un único ejemplar confirmado",
      "Clima": "Indiferente — supervivencia universal",
      Territorio: "Sectores galácticos completos",
      "Rol ecológico": "Depredador apex cósmico",
    },
  },
  {
    id: "feeding",
    numeral: "X",
    title: "Alimentación",
    cn: "进食",
    summary: "Dieta, método de caza y presas comunes.",
    fields: {
      Tipo: "Omnívoro cósmico",
      Dieta: "Planetas · energía estelar · biomasa consciente",
      "Caza": "Absorción dimensional directa",
      Presas: "Planetas habitables · asteroides masivos",
      "Depredadores": "Ninguno confirmado",
    },
  },
  {
    id: "lifecycle",
    numeral: "XI",
    title: "Ciclo de Vida",
    cn: "生命周期",
    summary: "Etapas evolutivas, esperanza de vida y reproducción.",
    fields: {
      Origen: "Huevo cósmico de cáscara obsidiana",
      Nacimiento: "Eclosión por presión interna del núcleo",
      Etapas: "Huevo → Cría → Adulto → Estelar VII → ∞",
      Madurez: "Inmediata al despertar del núcleo",
      "Esperanza de vida": "Indefinida",
      Reproducción: "Partenogénesis · puesta cada eón",
    },
  },
  {
    id: "variants",
    numeral: "XII",
    title: "Variantes",
    cn: "变体",
    summary: "Mutaciones, evoluciones y formas superiores.",
    fields: {
      Subespecies: "No registradas",
      "Variantes conocidas": "Adulto · alada juvenil · forma herida",
      Mutaciones: "Activación de núcleo doble (teórica)",
      Evoluciones: "Estelar I → VII (confirmado) → Universal (proyectado)",
      "Forma superior": "Soberano Universal del Vacío",
    },
  },
  {
    id: "civilizations",
    numeral: "XIII",
    title: "Civilizaciones",
    cn: "文明",
    summary: "Interacción con humanos y otras razas conscientes.",
    fields: {
      "Con humanos": "Hostil · devorador de civilizaciones",
      "Otras razas": "Hostil universal",
      Domesticación: "Imposible",
      "Valor cultural": "Mito fundacional del miedo cósmico",
      "Leyes": "Decreto de exterminio universal categoría Ω",
    },
  },
  {
    id: "resources",
    numeral: "XIV",
    title: "Recursos",
    cn: "资源",
    summary: "Materiales obtenibles y su valor estratégico.",
    fields: {
      "Materiales": "Cuerno dorado · fragmento de núcleo · escama obsidiana",
      "Partes": "Núcleo (incalculable) · cuernos (arma divina)",
      Usos: "Forja de armamento de rango cósmico",
      Valor: "Inestimable — fuera de mercado",
      "Extracción": "Solo tras aniquilación confirmada",
      Peligro: "Catastrófico Ω",
    },
  },
  {
    id: "history",
    numeral: "XV",
    title: "Historia y Mito",
    cn: "历史",
    summary: "Primer registro, leyendas y eventos clave.",
    fields: {
      "Primer registro": "Era Primigenia · antes de la consciencia",
      "Civilizaciones": "Imperios estelares ya extintos",
      Leyendas: "El Devorador que ha de regresar al final de los tiempos",
      Eventos: "Aniquilación de la Tercera Federación Galáctica",
      Creencias: "Encarnación del hambre cósmica",
    },
  },
  {
    id: "explorers",
    numeral: "XVI",
    title: "Registro de Exploradores",
    cn: "探索者",
    summary: "Avistamientos confirmados y bitácora de campo.",
    fields: {
      "Primer avistamiento": "Era Estelar 0 · referencia perdida",
      "Último avistamiento": "Sector Yangzhou · invasión cataclísmica",
      Investigador: "Comando Hou Fan — Federación Terrestre",
      Clasificación: "Ω — acceso restringido",
      Bitácora:
        "«No se le combate. Se le sobrevive.» — Luo Feng, Bitácora del Soberano",
    },
  },
  {
    id: "additional",
    numeral: "XVII",
    title: "Datos Adicionales",
    cn: "其他",
    summary: "Curiosidades, mitos falsos y estado actual.",
    fields: {
      Curiosidades: "Su rugido genera tormentas eléctricas en 200 km",
      "Mitos falsos": "Se creía vulnerable al fuego — falso, lo absorbe",
      Secretos: "Su núcleo guarda memoria de eras anteriores",
      Restringido: "Localización actual · clasificada Ω",
      "Estado actual": "Despierto · en migración",
      "Decreto": "Toda confrontación directa desaconsejada universalmente.",
    },
  },
];

// ─────────────────── NEW: TIMELINE (creative addition) ────────────────────
export const timeline = [
  { era: "Era −∞", event: "Surgimiento del huevo cósmico en el alba del universo." },
  { era: "Era I", event: "Eclosión. Primera consciencia devoradora despierta." },
  { era: "Era III", event: "Aniquilación de la Tercera Federación Galáctica." },
  { era: "Era VII", event: "Asciende a Estelar Rango VII por absorción masiva." },
  { era: "Era IX", event: "Hibernación bajo el sector Yangzhou." },
  { era: "Era X", event: "Despertar y migración hacia el sistema solar interior." },
];

// ─────────────────── NEW: SCALE COMPARATIVE (creative addition) ───────────
export const scaleRefs = [
  { label: "Humano", value: 1.8, unit: "m" },
  { label: "Rascacielos", value: 380, unit: "m" },
  { label: "Bestia adulta", value: 800, unit: "m" },
  { label: "Forma estelar VII", value: 1400, unit: "m" },
  { label: "Mundo interior", value: 99999, unit: "km" },
];

export const finalRecord = {
  Nombre: "Bestia del Cuerno Dorado · 金角巨兽",
  Clasificación: "Bestia del Vacío Estelar · Linaje Primigenio",
  Nivel: "Estelar Rango VII",
  Amenaza: "Ω · Catastrófica Cósmica",
  Estado: "Activa · despierta",
  "Última actualización": "Era Estelar 9412.07.13",
};
