import refMain from "@/assets/char-main.jpg";
import refFront from "@/assets/char-front.jpg";
import refWeapon from "@/assets/char-weapon.jpg";
import refBack from "@/assets/char-back.jpg";
import refCasual from "@/assets/char-casual.jpg";
import refPortrait from "@/assets/char-portrait.jpg";

export type Stage = {
  id: string;
  cn: string;
  label: string;
  subtitle: string;
  chapter: string;
  description: string;
  plate: string;
  accent: string;
  threat: string;
  rank: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER VIEWS — main / front / weapon / back / casual / portrait
// ─────────────────────────────────────────────────────────────────────────────

export const stages: Stage[] = [
  {
    id: "main",
    cn: "VISTA PRINCIPAL",
    label: "Visualización Principal",
    subtitle: "Presencia · Identidad cinemática",
    chapter: "VIEW I · MAIN",
    description:
      "Plano cinemático principal del sujeto registrado. Concentra silueta, atmósfera y energía. Vista de presentación oficial para el archivo de entidades inteligentes.",
    plate: refMain,
    accent: "oklch(0.62 0.22 320)",
    threat: "Σ · Soberana",
    rank: "Apex Cosmica",
  },
  {
    id: "front",
    cn: "VISTA FRONTAL",
    label: "Cuerpo Completo · Frente",
    subtitle: "Equipo de combate · Análisis frontal",
    chapter: "VIEW II · FRONT",
    description:
      "Vista frontal completa con armadura de combate desplegada. Permite analizar la silueta táctica, el blindaje primario y la disposición del armamento integrado.",
    plate: refFront,
    accent: "oklch(0.72 0.16 200)",
    threat: "Σ · Combate",
    rank: "Battle Form",
  },
  {
    id: "weapon",
    cn: "ARMAMENTO DE COMBATE",
    label: "Arma · Garra de Resonancia",
    subtitle: "Tecnología · Filo de energía",
    chapter: "VIEW III · WEAPON",
    description:
      "Arma personal del sujeto: garra forjada en aleación obsidiana con núcleo de plasma cyan. Diseñada para corte dimensional a corta distancia con descarga magnética secundaria.",
    plate: refWeapon,
    accent: "oklch(0.78 0.14 195)",
    threat: "Λ · Letal",
    rank: "Artefacto S",
  },
  {
    id: "back",
    cn: "VISTA POSTERIOR",
    label: "Cuerpo Completo · Espalda",
    subtitle: "Blindaje posterior · Alas de energía",
    chapter: "VIEW IV · BACK",
    description:
      "Vista posterior completa. Revela el blindaje espinal, los grabados heráldicos del clan y el sistema alar de propulsión en plasma desplegado en formación de vuelo.",
    plate: refBack,
    accent: "oklch(0.7 0.15 180)",
    threat: "Σ · Vuelo",
    rank: "Aero Form",
  },
  {
    id: "casual",
    cn: "ATUENDO CIVIL",
    label: "Vestimenta Civil · Frente",
    subtitle: "Identidad social · Apariencia cultural",
    chapter: "VIEW V · CASUAL",
    description:
      "Apariencia civil del sujeto fuera del rol de combate. Muestra estilo personal, código cultural y porte diplomático en sociedades aliadas.",
    plate: refCasual,
    accent: "oklch(0.78 0.13 80)",
    threat: "— · Civil",
    rank: "Diplomática",
  },
  {
    id: "portrait",
    cn: "RETRATO DE PERFIL",
    label: "Retrato · Perfil Oficial",
    subtitle: "Identidad facial · Rasgos de especie",
    chapter: "VIEW VI · PORTRAIT",
    description:
      "Retrato oficial de archivo. Resalta los rasgos de especie, la pigmentación, los implantes y la expresión característica del sujeto registrado.",
    plate: refPortrait,
    accent: "oklch(0.7 0.12 240)",
    threat: "ID · Verificada",
    rank: "Perfil oficial",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DOSSIER — character-focused profile sections
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
    title: "Perfil de Identidad",
    cn: "身份",
    summary: "Nombre, especie, origen y estatus oficial del sujeto.",
    fields: {
      Nombre: "Vennara Hollowstar",
      Alias: "La Reina del Velo · Banshee Sovereign",
      Especie: "Humanoide simbiótico (clase aracno-cósmica)",
      Raza: "Hollowstar — linaje primigenio",
      Origen: "Planeta Velkhar · Cúmulo Estelar Hyades",
      Edad: "~ 2.140 ciclos estelares",
      Género: "Femenino",
      Clasificación: "Soberana · Liga Inmortal",
      Estado: "Activa · en misión diplomática",
    },
  },
  {
    id: "physical",
    numeral: "II",
    title: "Descripción Física",
    cn: "体征",
    summary: "Dimensiones, complexión, color y rasgos distintivos.",
    fields: {
      Altura: "1,93 m (forma humanoide) · 4,80 m (forma plena)",
      Complexión: "Esbelta · exoesqueleto parcial dorsal",
      Apariencia: "Femenina, regia, piel pálida con tatuajes lumínicos",
      Pigmentación: "Cabello blanco-violeta · ojos azul cobalto",
      "Rasgos distintivos": "Corona de espinas · cristales magenta en torso",
      "Marcas heráldicas": "Sigilo del Velo grabado en clavícula",
      Postura: "Erguida, predatoria, control absoluto del centro de gravedad",
    },
  },
  {
    id: "species",
    numeral: "III",
    title: "Información de Especie",
    cn: "种族",
    summary: "Linaje, biología, capacidades naturales y debilidades.",
    fields: {
      Especie: "Hollowstar Sovereign",
      Evolución: "Simbiosis humanoide · arácnido cósmico",
      Biología: "Sistema circulatorio dual · médula cristalina luminiscente",
      "Tiempo de vida": "Indefinido bajo alimentación de energía estelar",
      Habilidades: "Tejido del velo · resonancia psíquica · regeneración",
      Debilidades: "Resonancia armónica inversa · luz solar tipo G2 directa",
      Compatibilidad: "Bioquímica compatible con razas Tellurianas clase III",
    },
  },
  {
    id: "combat",
    numeral: "IV",
    title: "Perfil de Combate",
    cn: "战斗",
    summary: "Estilo, maestría y técnicas de combate.",
    fields: {
      "Estilo de combate": "Asalto rápido · control de área psíquico",
      Maestría: "Garra de resonancia (S) · combate aéreo (A) · esgrima (A)",
      Distancia: "Corta y media · letal en duelo singular",
      Armadura: "Exotraje Hollow-Class IX (gold-line)",
      Fortalezas: "Velocidad supersónica · lectura predictiva",
      Técnicas: "Corte del Velo · Resonancia Magenta · Eco Espinado",
      "Récord registrado": "143 victorias confirmadas · 0 derrotas",
    },
  },
  {
    id: "equipment",
    numeral: "V",
    title: "Equipamiento",
    cn: "装备",
    summary: "Armas, armaduras y artefactos asignados.",
    fields: {
      "Arma principal": "Garra de Resonancia «Veth'al»",
      "Arma secundaria": "Dagas gemelas de plasma frío",
      Armadura: "Exo-traje Hollow-Class IX · alas de plasma desplegables",
      Artefactos: "Cristal del Velo · Anillo del Concilio Inmortal",
      Tecnología: "Núcleo de levitación grav-zero integrado en columna",
      Comunicaciones: "Banda cuántica privada de la Liga Inmortal",
    },
  },
  {
    id: "abilities",
    numeral: "VI",
    title: "Habilidades y Poderes",
    cn: "能力",
    summary: "Capacidades naturales, técnicas y especiales del sujeto.",
    fields: {
      "Habilidad natural": "Tejido del velo (manipulación dimensional local)",
      "Habilidad técnica": "Maestría en armas filo-energía clase S",
      Magia: "Resonancia armónica · ilusión psíquica",
      Tecnología: "Interface neural directa con armas y nave",
      Especiales: "Eco Espinado · Mirada del Soberano",
      Limitaciones: "Sobrecarga tras 9 minutos en estado pleno",
    },
  },
  {
    id: "personality",
    numeral: "VII",
    title: "Personalidad",
    cn: "性格",
    summary: "Conducta, rasgos y motivaciones psicológicas.",
    fields: {
      Conducta: "Calmada, calculadora, letal cuando se le provoca",
      Rasgos: "Disciplinada · soberbia controlada · leal a su clan",
      Motivaciones: "Preservar el linaje Hollowstar · venganza ancestral",
      Psicología: "Estratega de largo plazo, baja impulsividad",
      Voz: "Grave, melódica, con armónicos subsónicos",
      "Marca personal": "Nunca repite una amenaza dos veces",
    },
  },
  {
    id: "history",
    numeral: "VIII",
    title: "Historia y Trasfondo",
    cn: "历史",
    summary: "Origen, eventos clave y logros registrados.",
    fields: {
      "Origen": "Nacida en el santuario de Velkhar durante el Eclipse Mayor",
      "Evento I": "Caída de la Casa Hollowstar · supervivencia jurada",
      "Evento II": "Ascensión al Concilio Inmortal · ciclo 1.872",
      Logros: "Reconquista del sector Hyades · pacto con la Federación",
      Registros: "Bitácora soberana · 11 volúmenes clasificados Σ",
      "Cita célebre":
        "«El velo no se cruza dos veces — quien lo intenta, deja de ser.»",
    },
  },
  {
    id: "affiliations",
    numeral: "IX",
    title: "Afiliaciones",
    cn: "阵营",
    summary: "Organizaciones, civilizaciones, aliados y enemigos.",
    fields: {
      Organización: "Concilio Inmortal · Casa Hollowstar",
      Civilización: "Imperio del Velo · sector Hyades",
      Grupo: "Guardia Espinada (élite personal)",
      Aliados: "Federación Tellurian · Casa Veris",
      Enemigos: "Casa Drakorth · Sectarios del Fuego Vacío",
      Tratados: "Pacto de No-Agresión Estelar · Decreto Σ-07",
    },
  },
];

// ─────────────────── TIMELINE — eventos clave del sujeto ──────────────────
export const timeline = [
  { era: "Ciclo 0", event: "Nacimiento en el santuario de Velkhar bajo eclipse." },
  { era: "Ciclo 240", event: "Caída de la Casa Hollowstar y juramento de venganza." },
  { era: "Ciclo 870", event: "Forja de la Garra de Resonancia «Veth'al»." },
  { era: "Ciclo 1.872", event: "Ascensión al Concilio Inmortal como Soberana." },
  { era: "Ciclo 2.014", event: "Reconquista pacífica del sector Hyades." },
  { era: "Ciclo 2.140", event: "Misión diplomática activa con la Federación Tellurian." },
];

// ─────────────────── SCALE — referencia de tamaño ─────────────────────────
export const scaleRefs = [
  { label: "Humano estándar", value: 1.8, unit: "m" },
  { label: "Forma humanoide", value: 1.93, unit: "m" },
  { label: "Forma plena", value: 4.8, unit: "m" },
  { label: "Alas desplegadas", value: 7.2, unit: "m" },
  { label: "Aura psíquica", value: 320, unit: "m" },
];

export const finalRecord = {
  Nombre: "Vennara Hollowstar · 维娜拉",
  Clasificación: "Hollowstar Sovereign · Linaje Primigenio",
  Nivel: "Soberana · Concilio Inmortal",
  Amenaza: "Σ · Catastrófica controlada",
  Estado: "Activa · misión diplomática",
  "Última actualización": "Era Estelar 9412.07.13",
};
