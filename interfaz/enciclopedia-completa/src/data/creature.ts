// LOCATIONS ARCHIVE — data shape preserved from the original encyclopedia.
// "stages"            → Planetary observation scales (planet → hemisphere → core → continent → forbidden → unknown)
// "dossierSections"   → Location dossier (geography, environment, civilization, threats, exploration…)
// "timeline"          → Exploration record
// "scaleRefs"         → Spatial scale references
// "finalRecord"       → Archive footer

import refPlanet from "@/assets/creature-egg.jpg";          // Total planet view
import refContinent from "@/assets/creature-main.jpg";      // Continent / nation / city
import refInterior from "@/assets/creature-core.jpg";       // Internal structure cutaway
import refHemisphere from "@/assets/creature-world.jpg";    // Hemisphere / macro region
import refForbidden from "@/assets/creature-evolution.jpg"; // Forbidden zone
import refUnknown from "@/assets/creature-main.jpg";        // Unknown territory

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

export const stages: Stage[] = [
  {
    id: "planet",
    cn: "全行星",
    label: "Visión Planetaria Total",
    subtitle: "Escala 0 · Cuerpo celeste completo",
    chapter: "纪元 I · ESCALA I",
    description:
      "Astro registrado bajo designación Aelyn-VII. Esfera de 12.742 km de diámetro envuelta por una atmósfera respirable de tono cian. Las luces de civilización trazan corredores luminosos sobre el hemisferio nocturno, mientras tormentas perpetuas giran sobre los océanos ecuatoriales. Punto de partida del archivo de exploración.",
    plate: refPlanet,
    accent: "oklch(0.72 0.16 220)",
    threat: "α · Estable",
    rank: "Escala I",
  },
  {
    id: "hemisphere",
    cn: "半球",
    label: "Vista de Hemisferio",
    subtitle: "Escala II · Masa continental mayor",
    chapter: "纪元 II · ESCALA II",
    description:
      "Hemisferio austral fotografiado desde órbita baja. Dos supercontinentes flanquean un océano de bioluminiscencia esmeralda. Las casquetes polares se extienden hasta latitudes templadas y tres lunas mayores orbitan visibles sobre el horizonte. Climatología regida por corrientes magnéticas anómalas.",
    plate: refHemisphere,
    accent: "oklch(0.78 0.13 160)",
    threat: "α · Habitable",
    rank: "Escala II",
  },
  {
    id: "interior",
    cn: "行星内部",
    label: "Estructura Interna",
    subtitle: "Corte transversal · Capas planetarias",
    chapter: "纪元 III · ESCALA III",
    description:
      "Sección transversal del planeta revelando atmósfera, corteza, manto, núcleo externo fundido y núcleo interno cristalino. Actividad geológica clasificada como Tipo III. El núcleo emite pulsos electromagnéticos cuyo origen continúa bajo investigación del Consorcio de Cartografía Estelar.",
    plate: refInterior,
    accent: "oklch(0.7 0.22 35)",
    threat: "β · Energético",
    rank: "Núcleo",
  },
  {
    id: "continent",
    cn: "大陆都市",
    label: "Continente y Ciudades",
    subtitle: "Escala IV · Civilización dominante",
    chapter: "纪元 IV · ESCALA IV",
    description:
      "Llanuras de basalto cruzadas por ríos de energía teal donde se alzan las megaciudades aliadas. Los obeliscos arcanos marcan capitales: Vehrenmark al sur, Antarya en el delta luminoso, y la capital imperial Karnesh-Tor al horizonte. Centro político del hemisferio.",
    plate: refContinent,
    accent: "oklch(0.7 0.16 195)",
    threat: "γ · Civilizado",
    rank: "Imperial",
  },
  {
    id: "forbidden",
    cn: "禁区",
    label: "Zona Prohibida",
    subtitle: "Escala V · Anomalía catastrófica",
    chapter: "纪元 V · ESCALA V",
    description:
      "Páramo carmesí cubierto de cristal calcinado y monolitos rotos. Sobre el yermo se abre permanentemente una vorágine dimensional que distorsiona el tiempo local. Acceso prohibido por decreto del Concilio. Toda expedición previa ha sido reportada como pérdida total.",
    plate: refForbidden,
    accent: "oklch(0.55 0.22 15)",
    threat: "Ω · Mortal",
    rank: "Prohibido",
  },
  {
    id: "unknown",
    cn: "未知领域",
    label: "Territorio Desconocido",
    subtitle: "Escala ? · Sin cartografía confirmada",
    chapter: "纪元 VI · ESCALA ?",
    description:
      "Cuadrante sin escanear más allá de los confines explorados. Las sondas remotas devuelven datos incongruentes: deriva temporal, ausencia de coordenadas estables y geometría planetaria inconsistente. Catalogado como frontera abierta del archivo.",
    plate: refUnknown,
    accent: "oklch(0.62 0.14 280)",
    threat: "? · Sin clasificar",
    rank: "Frontera",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DOSSIER — Location archive sections
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
    summary: "Nombre, designación astral y emblema cartográfico.",
    fields: {
      "Nombre común": "Aelyn-VII",
      "Nombre ancestral": "Vehren-Aelyn · 维伦星",
      "Designación científica": "AEL-VII / Sector Yangzhou",
      "Nombres regionales": "Mundo Cian · Cuna Esmeralda · Astro Vigilado",
      "Clasificación": "Planeta habitable de clase II",
      "Emblema": "Dos lunas crecientes sobre disco esmeralda",
    },
  },
  {
    id: "classification",
    numeral: "II",
    title: "Clasificación Planetaria",
    cn: "分类",
    summary: "Tipo de cuerpo celeste, dominio y categoría exploratoria.",
    fields: {
      Tipo: "Planeta terrestre habitable",
      Dominio: "Sistema Vehrenár · Sector Yangzhou",
      Categoría: "Clase II · biosfera activa",
      Familia: "Mundos de bioma teal",
      Anillo: "Sin anillos confirmados",
      Linaje: "Cuerpo formado en la primera era estelar",
      Origen: "Acreción primaria · era VII del registro galáctico",
    },
  },
  {
    id: "scale",
    numeral: "III",
    title: "Escala y Coordenadas",
    cn: "坐标",
    summary: "Tamaño, masa, posición estelar y referencia orbital.",
    fields: {
      "Diámetro": "12.742 km ecuatorial",
      "Masa": "5.97 × 10²⁴ kg",
      "Coordenadas": "RA 17:42 · DEC −62°14'",
      "Distancia estelar": "1.04 UA del astro Vehren",
      "Período orbital": "412 días locales",
      "Rotación": "23h 51m · prograda",
    },
  },
  {
    id: "threat",
    numeral: "IV",
    title: "Nivel de Amenaza",
    cn: "威胁",
    summary: "Riesgos planetarios y zonas restringidas.",
    fields: {
      "Clase de amenaza": "γ · estable con bolsas Ω",
      "Riesgo global": "Moderado",
      "Zonas prohibidas": "Vorágine Carmesí · Hueco Antar",
      "Peligros principales": "Anomalías dimensionales en cuadrante sur",
      "Área restringida": "12.4% de la superficie planetaria",
    },
  },
  {
    id: "geography",
    numeral: "V",
    title: "Geografía",
    cn: "地理",
    summary: "Relieve, océanos y rasgos cartográficos.",
    fields: {
      "Superficie": "510 millones km²",
      "Océanos": "63% · agua salobre bioluminiscente",
      "Continentes": "Tres supercontinentes principales",
      "Punto más alto": "Pico Karnesh · 14.220 m",
      "Punto más bajo": "Fosa Antar · −11.030 m",
      "Rasgos distintivos": "Ríos de energía teal · monolitos antiguos",
    },
  },
  {
    id: "structure",
    numeral: "VI",
    title: "Estructura Interna",
    cn: "结构",
    summary: "Capas planetarias y actividad geológica.",
    fields: {
      "Atmósfera": "Nitrógeno 71% · Oxígeno 24% · trazas exóticas",
      "Corteza": "Basalto cristalino · espesor medio 38 km",
      "Manto": "Silicatos viscosos · convección activa",
      "Núcleo externo": "Hierro fundido · pulsos magnéticos anómalos",
      "Núcleo interno": "Cristal denso · origen no determinado",
      "Actividad": "Tectónica activa · 6 placas mayores",
    },
  },
  {
    id: "climate",
    numeral: "VII",
    title: "Clima y Atmósfera",
    cn: "气候",
    summary: "Patrones climáticos, biomas dominantes y fenómenos.",
    fields: {
      "Fuente": "Astro Vehren · enana K de tono ámbar",
      "Temperatura media": "13.4 °C global",
      "Estaciones": "Cuatro · ciclo de 412 días",
      "Vientos": "Corrientes magnéticas a 240 km/h en latitudes altas",
      "Fenómenos": "Auroras esmeralda · tormentas plasma",
      "Biomas": "Bosque cian · estepa basáltica · tundra polar",
    },
  },
  {
    id: "biology",
    numeral: "VIII",
    title: "Ecosistemas y Vida",
    cn: "生物",
    summary: "Formas de vida dominantes y biodiversidad.",
    fields: {
      "Biodiversidad": "Alta · 1.2M especies catalogadas",
      "Vida dominante": "Bípedos sapientes · razas Vehren-Karn",
      "Megafauna": "Levirathan de las llanuras · pájaros de cristal",
      "Flora característica": "Árboles bioluminiscentes · musgo teal",
      "Hábitats": "Bosques cian · cavernas glaciales · costa esmeralda",
      "Especies protegidas": "Las nueve razas ancestrales del Vehren",
    },
  },
  {
    id: "civilization",
    numeral: "IX",
    title: "Civilización",
    cn: "文明",
    summary: "Naciones, capitales y demografía registrada.",
    fields: {
      "Población": "≈ 3.4 mil millones",
      "Naciones": "Imperio Karnesh · Federación Antar · Reinos del Hielo",
      "Capital imperial": "Karnesh-Tor",
      "Idioma": "Vehren-Karn (oficial) · 47 dialectos regionales",
      "Gobierno": "Triunvirato planetario",
      "Edad tecnológica": "Clase IV · viaje supralumínico inicial",
    },
  },
  {
    id: "cities",
    numeral: "X",
    title: "Ciudades Principales",
    cn: "城市",
    summary: "Núcleos urbanos y plazas estratégicas.",
    fields: {
      "Karnesh-Tor": "Capital imperial · 42M habitantes",
      "Vehrenmark": "Ciudad portuaria del sur · centro comercial",
      "Antarya": "Megaciudad del delta luminoso",
      "Iskaros": "Academia y archivos del Concilio",
      "Velharn": "Fortaleza norte · centro militar",
      "Distritos especiales": "Templo de los Obeliscos · Mercado Espectral",
    },
  },
  {
    id: "resources",
    numeral: "XI",
    title: "Recursos",
    cn: "资源",
    summary: "Minerales, energía y materiales estratégicos.",
    fields: {
      "Minerales clave": "Cristal de Vehren · obsidiana energética",
      "Energía": "Líneas tectónicas teal · fusión cristalina",
      "Materiales raros": "Aleación Karn · polvo de monolito",
      "Comercio": "Exportación de cristal a sectores vecinos",
      "Valor estratégico": "Crítico · acceso restringido",
    },
  },
  {
    id: "natural",
    numeral: "XII",
    title: "Lugares Naturales",
    cn: "自然",
    summary: "Maravillas geográficas y enclaves protegidos.",
    fields: {
      "Bosque Cian": "Selva bioluminiscente continental",
      "Cordillera Karnesh": "Cadena montañosa de 4.000 km",
      "Mar Esmeralda": "Océano interior bioluminiscente",
      "Cavernas de Velharn": "Sistema subterráneo de 800 km",
      "Valle Antar": "Depresión cubierta de neblina perpetua",
      "Desierto de Vidrio": "Llanura de sílice cristalizada",
    },
  },
  {
    id: "forbidden",
    numeral: "XIII",
    title: "Zonas Prohibidas",
    cn: "禁区",
    summary: "Áreas de acceso restringido y anomalías.",
    fields: {
      "Vorágine Carmesí": "Tormenta dimensional permanente · sur",
      "Hueco Antar": "Cráter de origen desconocido · sin retorno",
      "Cuadrante 7-Ω": "Anomalía gravitacional registrada",
      "Estado": "Decreto Ω · expediciones prohibidas",
      "Acceso": "Solo con autorización del Concilio Estelar",
      "Pérdidas": "14 expediciones · 1.842 desaparecidos",
    },
  },
  {
    id: "history",
    numeral: "XIV",
    title: "Historia",
    cn: "历史",
    summary: "Eras, eventos clave y descubrimiento.",
    fields: {
      "Primer registro": "Era Estelar 4120",
      "Descubierto por": "Sonda Vehren-I · Flota Yangzhou",
      "Era fundacional": "Imperio Karnesh · Era 7100",
      "Eventos clave": "Guerra de los Obeliscos · Pacto del Concilio",
      "Era actual": "Era Estelar 9412",
      "Estatus diplomático": "Miembro pleno de la Liga de Mundos",
    },
  },
  {
    id: "exploration",
    numeral: "XV",
    title: "Registro de Exploración",
    cn: "探索",
    summary: "Expediciones, descubrimientos y misiones activas.",
    fields: {
      "Primera expedición": "Hou Fan · Era 4120 · cartografía inicial",
      "Última expedición": "Luo Feng · Era 9412 · sector prohibido",
      "Expediciones activas": "Siete · misiones de cartografía profunda",
      "Descubrimientos recientes": "Cámara cristalina bajo Karnesh-Tor",
      "Investigador jefe": "Comando Hou Fan — Federación Terrestre",
      "Bitácora":
        "«No se conquista un mundo. Se le sobrevive lo suficiente para comprenderlo.» — Luo Feng",
    },
  },
  {
    id: "additional",
    numeral: "XVI",
    title: "Datos Adicionales",
    cn: "其他",
    summary: "Curiosidades, leyendas y estado actual del registro.",
    fields: {
      Curiosidades: "Las auroras esmeralda emiten frecuencias musicales",
      "Mitos falsos": "Se creía deshabitado — desmentido en Era 4188",
      Secretos: "Los monolitos antiguos preceden al imperio actual",
      Restringido: "Cartografía completa del cuadrante 7-Ω · clase Ω",
      "Estado actual": "Estable · monitorización activa",
      "Decreto": "Visitas civiles permitidas en zonas verdes únicamente.",
    },
  },
];

// ─────────────────── TIMELINE — Exploration record ──────────────────────────
export const timeline = [
  { era: "Era 4120", event: "Sonda Vehren-I detecta firma planetaria de Aelyn-VII." },
  { era: "Era 4188", event: "Primera expedición humana confirma biosfera y civilización." },
  { era: "Era 7100", event: "Imperio Karnesh es reconocido por la Liga de Mundos." },
  { era: "Era 8240", event: "Apertura de la Vorágine Carmesí · zona declarada prohibida." },
  { era: "Era 9211", event: "Pacto del Concilio Estelar firmado en Karnesh-Tor." },
  { era: "Era 9412", event: "Expedición Luo Feng cartografía el cuadrante 7-Ω." },
];

// ─────────────────── SCALE — Spatial reference ──────────────────────────────
export const scaleRefs = [
  { label: "Humano", value: 1.8, unit: "m" },
  { label: "Megaciudad", value: 320, unit: "km" },
  { label: "Continente", value: 8400, unit: "km" },
  { label: "Diámetro planetario", value: 12742, unit: "km" },
  { label: "Órbita estelar", value: 155_000_000, unit: "km" },
];

export const finalRecord = {
  Nombre: "Aelyn-VII · 维伦星",
  Clasificación: "Planeta habitable clase II · Sector Yangzhou",
  Escala: "Cuerpo planetario completo",
  Amenaza: "γ · estable con bolsas Ω",
  Estado: "Activo · cartografía en curso",
  "Última actualización": "Era Estelar 9412.07.13",
};
