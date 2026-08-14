import type React from "react";
import {
  BookMarked, Microscope, Leaf, Sprout, Dna, Network, Mountain, Sparkles,
  FlaskRound, Gem, History, Landmark, Telescope, Map as MapIcon, Activity, FileLock2,
} from "lucide-react";

import blackVineAsset from "@/assets/plant-black-vine.png";
import starGrassAsset from "@/assets/plant-star-grass.png";
import crowRootAsset from "@/assets/plant-crow-root.png";
import manEaterAsset from "@/assets/plant-man-eater.png";
import phaseSeedAsset from "@/assets/phase-1-seed.png";
import phaseSproutAsset from "@/assets/phase-2-sprout.png";
import phaseJuvenileAsset from "@/assets/phase-3-juvenile.png";
import phaseBloomAsset from "@/assets/phase-4-bloom.png";
import phaseAncestralAsset from "@/assets/phase-5-ancestral.png";
import { assetUrl } from "@/lib/asset-url";

const blackVine = assetUrl(blackVineAsset);
const starGrass = assetUrl(starGrassAsset);
const crowRoot = assetUrl(crowRootAsset);
const manEater = assetUrl(manEaterAsset);
const phaseSeed = assetUrl(phaseSeedAsset);
const phaseSprout = assetUrl(phaseSproutAsset);
const phaseJuvenile = assetUrl(phaseJuvenileAsset);
const phaseBloom = assetUrl(phaseBloomAsset);
const phaseAncestral = assetUrl(phaseAncestralAsset);

/* ===================== DATA ===================== */

export interface Phase {
  id: string;
  label: string;
  cn: string;
  image: string;
  glow: string; // ambient oklch
  ambient: string; // gold rgb for theming
  description: string;
  stats: { label: string; value: string }[];
}

export interface Plant {
  id: string;
  common: string;
  scientific: string;
  ancestral: string;
  cn: string;
  classification: string;
  level: string;
  rarity: string;
  status: string;
  threat: string;
  rank: string;
  frequency: string;
  description: string;
  image: string;
  ambient: string; // oklch
  biology: { kingdom: string; family: string; species: string; lineage: string };
  anatomy: { root: string; stem: string; leaves: string; flower: string; seed: string };
  growth: { speed: string; age: string; cycle: string };
  energy: { mana: number; vitality: number; affinity: string; absorption: number };
  powers: { regen: number; magicProd: number; adaptation: number; envControl: number };
  habitat: { region: string; climate: string; ecosystem: string };
  ecology: { creatures: string; soil: string; environment: string };
  resources: { name: string; grade: string }[];
  alchemy: { potions: string; medicine: string; magic: string };
  history: { discovery: string; civilizations: string; legend: string };
  distribution: { x: number; y: number; label: string }[];
  research: { level: string; explorers: string; notes: string };
  ether: number[];
  logs: string[];
  /** Botanical scale comparison (meters) for the holographic scale module. */
  scale: { label: string; m: number }[];
}

export const PHASES: Phase[] = [
  {
    id: "seed", label: "Semilla Primordial", cn: "原种", image: phaseSeed,
    glow: "oklch(0.78 0.13 80)", ambient: "210 170 110",
    description: "Núcleo dormante envuelto en cáscara cristalo-orgánica. Latencia milenaria, energía concentrada en potencial puro.",
    stats: [{ label: "Edad", value: "1.2k ciclos" }, { label: "Energía", value: "12%" }, { label: "Potencial", value: "Ω-Alto" }],
  },
  {
    id: "sprout", label: "Brote Inicial", cn: "萌芽", image: phaseSprout,
    glow: "oklch(0.82 0.16 150)", ambient: "150 220 160",
    description: "Primera ruptura de la cáscara. Cotiledón fotosensible y red miceliar incipiente buscan signatura mágica del suelo.",
    stats: [{ label: "Crecimiento", value: "+0.4 cm/día" }, { label: "Adaptación", value: "62%" }, { label: "Energía", value: "34%" }],
  },
  {
    id: "juvenile", label: "Forma Juvenil", cn: "幼体", image: phaseJuvenile,
    glow: "oklch(0.80 0.14 170)", ambient: "120 220 200",
    description: "Estructura definida. Tallo vascular maduro, primer follaje completo, secreciones bioactivas en fase de calibración.",
    stats: [{ label: "Desarrollo", value: "68%" }, { label: "Altura", value: "1.4 m" }, { label: "Estabilidad", value: "Alta" }],
  },
  {
    id: "bloom", label: "Floración", cn: "盛放", image: phaseBloom,
    glow: "oklch(0.84 0.18 320)", ambient: "230 140 220",
    description: "Apertura pétalica completa. Producción máxima de néctar mágico, picos de maná, ciclo reproductivo activo.",
    stats: [{ label: "Poder Máx.", value: "98%" }, { label: "Maná/h", value: "1240" }, { label: "Resonancia", value: "Ω" }],
  },
  {
    id: "ancestral", label: "Forma Ancestral", cn: "古始", image: phaseAncestral,
    glow: "oklch(0.78 0.16 50)", ambient: "255 180 100",
    description: "Evolución legendaria. Estructura semi-divina, conciencia botánica, capaz de moldear ecosistemas enteros a su alrededor.",
    stats: [{ label: "Evolución", value: "Final" }, { label: "Edad", value: "120k ciclos" }, { label: "Rango", value: "S+" }],
  },
];

export const PLANTS: Plant[] = [
  {
    id: "eclipse-flower",
    common: "Flor del Eclipse",
    scientific: "Ecliptus Aeterna",
    ancestral: "蚀月之花 · Soberana del Crepúsculo",
    cn: "蚀月之花",
    classification: "Flora Celestial",
    level: "Nivel IX",
    rarity: "Mítica · Ω",
    status: "Floración estable",
    threat: "Δ · Restringida",
    rank: "Rango IX",
    frequency: "44.8 GHz",
    description:
      "Apodada «Shi Yue Zhi Hua». Florece únicamente durante eclipses cósmicos, drenando luz estelar y emitiendo polen de gravedad invertida. Sólo se han registrado siete especímenes vivos en doce eras.",
    image: manEater,
    ambient: "oklch(0.84 0.18 320)",
    biology: { kingdom: "Plantae · Celestialis", family: "Ecliptaceae", species: "Aeterna Eclipsis", lineage: "Pre-cósmico · Era 0" },
    anatomy: {
      root: "Sistema cristalino que penetra ley-lines magnéticas",
      stem: "Vascular obsidiana con anillos lumínicos",
      leaves: "Lanceoladas, refractan radiación ionizante",
      flower: "Corola heptapétala de 1.4m de diámetro",
      seed: "Cápsula gravitacional con núcleo de antimateria contenida",
    },
    growth: { speed: "Glacial · 1 nodo / siglo", age: "≥ 12.000 ciclos", cycle: "Eclíptico · 408 días" },
    energy: { mana: 96, vitality: 88, affinity: "Sombra · Gravedad · Luz", absorption: 92 },
    powers: { regen: 78, magicProd: 96, adaptation: 64, envControl: 88 },
    habitat: { region: "Mesetas de la Sombra Larga", climate: "Crepuscular permanente · −12 °C", ecosystem: "Praderas de cristal lunar" },
    ecology: {
      creatures: "Simbiótica con polillas-espejo y zorros de marea",
      soil: "Regolito imantado · alta concentración de ilménium",
      environment: "Estabiliza el equilibrio gravitacional local en 3 km",
    },
    resources: [
      { name: "Raíz Cristalina", grade: "S+" },
      { name: "Pétalo Eclíptico", grade: "Ω" },
      { name: "Semilla Gravitacional", grade: "S" },
      { name: "Extracto de Polen", grade: "A+" },
    ],
    alchemy: {
      potions: "Elixir del Crepúsculo Eterno · Tintura de Sombra Líquida",
      medicine: "Tratamiento de quemaduras psíquicas y disrupciones temporales",
      magic: "Catalizador para hechizos de gravedad y manipulación lunar",
    },
    history: {
      discovery: "Año 4.281 · expedición Heliópolis-IX",
      civilizations: "Reverenciada por los Eclesiastas del Eclipse y la Casa Áurea",
      legend: "Se dice que su primera semilla cayó de la lágrima de la última estrella moribunda.",
    },
    distribution: [
      { x: 22, y: 18, label: "Heliópolis" },
      { x: 48, y: 34, label: "Sombra Larga" },
      { x: 70, y: 22, label: "Borde Ω" },
      { x: 88, y: 54, label: "Cinturón Lunar" },
    ],
    research: {
      level: "9 / 12 secciones desbloqueadas",
      explorers: "Dra. K. Yün · Lic. R. Astur · Maestro Volk",
      notes: "Manipular sólo con guantes de plomo encantado. No exponer a luz solar directa.",
    },
    ether: [12, 22, 38, 52, 64, 78, 92, 84, 72, 58, 44, 36, 28, 22, 18, 14],
    logs: [
      "[03:42:18] floración del 88% · eclipse en T-04:12",
      "[03:43:02] polen gravitacional liberado · −0.4 g local",
      "[03:44:21] resonancia eclíptica estable",
    ],
    scale: [
      { label: "Humano", m: 1.8 },
      { label: "Tallo maduro", m: 6 },
      { label: "Corola abierta", m: 1.4 },
      { label: "Aura gravitacional", m: 3000 },
    ],
  },
  {
    id: "black-vine",
    common: "Enredadera Negra",
    scientific: "Atrum Volubilis Nyx",
    ancestral: "黑色藤蔓 · Reina de Nyx",
    cn: "黑色藤蔓",
    classification: "Flora Depredadora",
    level: "Nivel VIII",
    rarity: "Épica · Σ",
    status: "Activa · Caza nocturna",
    threat: "Ω · Catastrófica",
    rank: "Rango VIII",
    frequency: "87.4 GHz",
    description:
      "Enredadera fotófoba carnívora. Detecta masa cinética mediante fibras miceliales y azota a la presa a 38 m/s. Secreta látex neuro-paralizante de acción inmediata.",
    image: blackVine,
    ambient: "oklch(0.78 0.14 280)",
    biology: { kingdom: "Plantae · Predatoria", family: "Nyxaceae", species: "Volubilis Nyx", lineage: "Era de la Umbra · 2.4M ciclos" },
    anatomy: {
      root: "Red miceliar subterránea de 80m de radio",
      stem: "Zarcillos contráctiles con fibras musculares vegetales",
      leaves: "Vestigiales · fotófobas",
      flower: "Inflorescencia trampa con dientes queratinosos",
      seed: "Bayas de látex con dispersión por presa",
    },
    growth: { speed: "Rápida · +12 cm/día", age: "180 — 600 ciclos", cycle: "Anual depredador" },
    energy: { mana: 64, vitality: 92, affinity: "Sombra · Veneno", absorption: 78 },
    powers: { regen: 88, magicProd: 54, adaptation: 84, envControl: 62 },
    habitat: { region: "Confines Nyx", climate: "Sotobosque húmedo · 0.02 lx", ecosystem: "Selvas perpetuamente oscuras" },
    ecology: {
      creatures: "Antagonista de criaturas de sangre caliente",
      soil: "Humus negro · pH 4.2 · alto contenido orgánico",
      environment: "Empobrece la fauna local en 200m a la redonda",
    },
    resources: [
      { name: "Látex Negro", grade: "A+" },
      { name: "Zarcillo Seco", grade: "B+" },
      { name: "Baya Necrótica", grade: "A" },
      { name: "Fibra Miceliar", grade: "S" },
    ],
    alchemy: {
      potions: "Veneno paralizante grado militar · Brebaje del Asesino",
      medicine: "Anestésico quirúrgico en dosis controladas",
      magic: "Componente para conjuros de constricción y captura",
    },
    history: {
      discovery: "Era Pre-Forestal · 12.6M ciclos",
      civilizations: "Cultivada por la Hermandad del Velo Negro",
      legend: "Se dice que nació de la sombra de un dios caído; sus zarcillos aún buscan el calor de los vivos.",
    },
    distribution: [
      { x: 18, y: 32, label: "Nyx Central" },
      { x: 36, y: 58, label: "Hondonadas" },
      { x: 62, y: 41, label: "Subducción" },
      { x: 80, y: 70, label: "Velo Negro" },
    ],
    research: {
      level: "11 / 12 secciones desbloqueadas",
      explorers: "Dr. M. Caine · Cap. Veil · Erud. Solm",
      notes: "Nunca acercarse sin traje térmico inverso. Detecta calor corporal a 14m.",
    },
    ether: [8, 14, 22, 32, 44, 58, 72, 82, 76, 64, 52, 42, 32, 24, 18, 14],
    logs: [
      "[02:11:08] eco cinético registrado a 14m",
      "[02:11:42] estallido feromonal +218%",
      "[02:12:09] zarcillo contraído · presa neutralizada",
    ],
    scale: [
      { label: "Humano", m: 1.8 },
      { label: "Zarcillo extendido", m: 38 },
      { label: "Dosel de caza", m: 60 },
      { label: "Red miceliar", m: 160 },
    ],
  },
  {
    id: "star-grass",
    common: "Hierba Devoradora de Estrellas",
    scientific: "Astrophaga Gramineae",
    ancestral: "食星草 · Pradera Helios",
    cn: "食星草",
    classification: "Flora Estelar",
    level: "Nivel V",
    rarity: "Rara · A",
    status: "Expansión activa",
    threat: "γ · Ambiental",
    rank: "Rango V",
    frequency: "21.2 GHz",
    description:
      "Hierba bioluminiscente que consume radiación estelar. Forma praderas inmensas que atenúan la luz local, sumiendo sistemas enteros en crepúsculo perpetuo.",
    image: starGrass,
    ambient: "oklch(0.84 0.16 130)",
    biology: { kingdom: "Plantae · Stellaris", family: "Astrophagaceae", species: "Gramineae Edax", lineage: "Génesis Estelar · pre-ciclo" },
    anatomy: {
      root: "Filamentos plata de 30 cm",
      stem: "Cilíndrico · hueco · fluorescente",
      leaves: "Lineales con membranas fotovoltaicas",
      flower: "Espigas radiantes de 12 cm",
      seed: "Espora de helio · dispersión por viento solar",
    },
    growth: { speed: "Explosiva · cubre 1 ha/mes", age: "30 — 80 ciclos", cycle: "Bianual estelar" },
    energy: { mana: 72, vitality: 64, affinity: "Luz · Radiación", absorption: 96 },
    powers: { regen: 92, magicProd: 78, adaptation: 88, envControl: 70 },
    habitat: { region: "Mesetas Helios", climate: "Alta radiación · 6.2 Sv/h", ecosystem: "Llanuras expuestas a estrellas en colapso" },
    ecology: {
      creatures: "Atrae herbívoros fotosintéticos · repele insectos",
      soil: "Arena cristalina · mineralizada",
      environment: "Reduce la luz ambiental en hasta 40%",
    },
    resources: [
      { name: "Espiga Solar", grade: "S+" },
      { name: "Filamento Plata", grade: "A" },
      { name: "Espora Helio", grade: "S" },
      { name: "Extracto Fotónico", grade: "A+" },
    ],
    alchemy: {
      potions: "Tónico de visión solar · Bálsamo lumínico",
      medicine: "Tratamiento de cegueras mágicas y pestes de sombra",
      magic: "Combustible para hechizos solares y barreras de luz",
    },
    history: {
      discovery: "Era Heliotrópica · 84k ciclos",
      civilizations: "Cultivada por monjes solares de Aurea",
      legend: "Semilla del primer sol moribundo, dispersada por el viento del vacío.",
    },
    distribution: [
      { x: 22, y: 18, label: "Helios Α" },
      { x: 48, y: 34, label: "Crepúsculo" },
      { x: 70, y: 22, label: "Estrellas Caídas" },
      { x: 88, y: 54, label: "Borde Solar" },
    ],
    research: {
      level: "12 / 12 secciones completas",
      explorers: "Maestra Sol · Lic. Helios · Dr. Auren",
      notes: "Recolectar al alba, nunca al cenit. Usar protección anti-radiación.",
    },
    ether: [40, 52, 64, 76, 84, 88, 82, 74, 66, 58, 52, 48, 44, 42, 40, 38],
    logs: [
      "[06:11:02] absorción fotónica nominal",
      "[06:11:45] expansión de pradera +0.3%",
      "[06:12:09] pico de radiación contenido",
    ],
    scale: [
      { label: "Humano", m: 1.8 },
      { label: "Espiga radiante", m: 0.9 },
      { label: "Pradera (1 ha)", m: 100 },
      { label: "Umbra estelar", m: 5000 },
    ],
  },
  {
    id: "crow-root",
    common: "Raíz Cuervo Milenaria",
    scientific: "Corvus Radix Millennium",
    ancestral: "千年黑乌根 · Ápice Subterráneo",
    cn: "千年黑乌根",
    classification: "Flora Subterránea",
    level: "Nivel X",
    rarity: "Legendaria · Ω+",
    status: "Latencia geológica",
    threat: "Ω+ · Ápice",
    rank: "Rango X",
    frequency: "2.1 Hz",
    description:
      "Depredador geológicamente lento. Sistema radicular milenario que se disfraza de suelo forestal, devorando criaturas enteras en su fauce abisal.",
    image: crowRoot,
    ambient: "oklch(0.74 0.18 40)",
    biology: { kingdom: "Plantae · Abyssalis", family: "Corvigaceae", species: "Radix Millennium", lineage: "Pre-Forestal · 12.6M ciclos" },
    anatomy: {
      root: "Sistema abisal de 880m · fauce activa",
      stem: "Camuflado como tronco caído",
      leaves: "Hojarasca falsa con esporas hipnóticas",
      flower: "Inflorescencia subterránea · jamás vista",
      seed: "Espinosa · dispersada por terremotos",
    },
    growth: { speed: "Geológica · 1 m / siglo", age: "≥ 12 millones de ciclos", cycle: "Eones" },
    energy: { mana: 36, vitality: 96, affinity: "Tierra · Hierro · Vacío", absorption: 84 },
    powers: { regen: 52, magicProd: 42, adaptation: 96, envControl: 78 },
    habitat: { region: "Vetas Subterra", climate: "Cavernoso · 4 °C constante", ecosystem: "Cavidades bajo bosques antiguos" },
    ecology: {
      creatures: "Devora todo lo que cae · sin antagonistas",
      soil: "Roca metamórfica · vetas de hierro",
      environment: "Causa temblores rítmicos de 2.1 Hz",
    },
    resources: [
      { name: "Núcleo Radicular", grade: "Ω+" },
      { name: "Madera Petrificada", grade: "S" },
      { name: "Espora Hipnótica", grade: "A+" },
      { name: "Ácido Digestivo", grade: "S+" },
    ],
    alchemy: {
      potions: "Disolvente alquímico universal · Brebaje de la Tierra",
      medicine: "Antídoto contra petrificación",
      magic: "Anclaje para hechizos de invocación geomántica",
    },
    history: {
      discovery: "Era Pre-Forestal · descubierta por accidente",
      civilizations: "Temida por todas las civilizaciones subterráneas",
      legend: "Más vieja que los reinos de arriba, recuerda cada paso — y el primero que la alimentó.",
    },
    distribution: [
      { x: 12, y: 62, label: "Vetas Norte" },
      { x: 32, y: 74, label: "Corazón Hierro" },
      { x: 55, y: 60, label: "Bosque Huesos" },
      { x: 78, y: 80, label: "Subterra Ω" },
    ],
    research: {
      level: "7 / 12 secciones desbloqueadas",
      explorers: "Geól. Drun · Cap. Iron · Erud. Vell",
      notes: "Cartografía incompleta. La fauce ha tragado tres expediciones completas.",
    },
    ether: [4, 8, 14, 24, 38, 54, 68, 78, 82, 74, 60, 48, 36, 28, 20, 14],
    logs: [
      "[01:08:33] temblor 2.1 Hz detectado",
      "[01:09:02] cierre de fauce registrado",
      "[01:09:58] respiradero térmico estable",
    ],
    scale: [
      { label: "Humano", m: 1.8 },
      { label: "Fauce visible", m: 12 },
      { label: "Tronco-señuelo", m: 40 },
      { label: "Sistema radicular", m: 880 },
    ],
  },
];

/**
 * 10 secciones canónicas — flujo natural de una planta.
 * I  Identidad → II  Anatomía → III  Crecimiento → IV  Evolución →
 * V  Ecología → VI  Hábitat → VII  Energía → VIII  Alquimia → IX  Recursos → X  Investigación.
 * Una sola fuente de verdad: el visor, el índice y el "acceso rápido" lo consumen.
 */
export const TABS = [
  "PERFIL BOTÁNICO",
  "ANATOMÍA VEGETAL",
  "CICLO DE VIDA",
  "EVOLUCIÓN",
  "ECOLOGÍA",
  "HÁBITAT",
  "ENERGÍA Y MAGIA",
  "ALQUIMIA",
  "RECURSOS",
  "INVESTIGACIÓN",
] as const;
export type Tab = typeof TABS[number];

export const TAB_ICONS: Record<Tab, React.ComponentType<{ className?: string }>> = {
  "PERFIL BOTÁNICO": BookMarked,
  "ANATOMÍA VEGETAL": Leaf,
  "CICLO DE VIDA": Sprout,
  "EVOLUCIÓN": Dna,
  "ECOLOGÍA": Network,
  "HÁBITAT": Mountain,
  "ENERGÍA Y MAGIA": Sparkles,
  "ALQUIMIA": FlaskRound,
  "RECURSOS": Gem,
  "INVESTIGACIÓN": Telescope,
};

export const SECTIONS: { n: string; label: Tab; question: string }[] = [
  { n: "I",    label: "PERFIL BOTÁNICO",   question: "¿Qué es?" },
  { n: "II",   label: "ANATOMÍA VEGETAL",  question: "¿Cómo está formada?" },
  { n: "III",  label: "CICLO DE VIDA",     question: "¿Cómo crece?" },
  { n: "IV",   label: "EVOLUCIÓN",         question: "¿Cómo cambia?" },
  { n: "V",    label: "ECOLOGÍA",          question: "¿Con qué convive?" },
  { n: "VI",   label: "HÁBITAT",           question: "¿Dónde vive?" },
  { n: "VII",  label: "ENERGÍA Y MAGIA",   question: "¿Qué poder posee?" },
  { n: "VIII", label: "ALQUIMIA",          question: "¿Qué transforma?" },
  { n: "IX",   label: "RECURSOS",          question: "¿Qué utilidad tiene?" },
  { n: "X",    label: "INVESTIGACIÓN",     question: "¿Qué sabemos?" },
];

/* ===================== DERIVED DATA (per plant, deterministic) ===================== */

export function derived(plant: Plant) {
  const id = plant.id;
  return {
    genetics: {
      genome: id === "eclipse-flower" ? "ΨX-7 · 12 cromátidas cristalinas"
        : id === "black-vine" ? "NYX-Ω · 9 hebras mio-vegetales"
        : id === "star-grass" ? "HEL-Σ · 6 hebras fotónicas"
        : "ABY-Δ · 14 hebras minerales",
      mutations: id === "eclipse-flower"
        ? ["Cromopétalo invertido (Ω-rara)", "Núcleo gravítico bicéfalo", "Floración albina"]
        : id === "black-vine"
        ? ["Zarcillo blanco (latente)", "Híbrido sangrante", "Variante áfica"]
        : id === "star-grass"
        ? ["Espiga doble · radiante", "Cepa amarilla helios", "Forma enana de altitud"]
        : ["Fauce reflejante", "Cepa azul subterránea", "Variante hueca"],
      variants: ["Tipo Α — silvestre", "Tipo Β — cultivada", "Tipo Γ — feral", "Tipo Δ — degenerada"],
      env: id === "eclipse-flower" ? "Sensible a eclipses lunares y resonancia gravitacional"
        : id === "black-vine" ? "Sensible a luz UV y temperatura corporal cercana"
        : id === "star-grass" ? "Acelera mutación bajo radiación cósmica intensa"
        : "Estable salvo terremotos prolongados",
      possible: id === "eclipse-flower"
        ? "Posible ascensión a forma «Estrella Caída» (no confirmada)"
        : id === "black-vine"
        ? "Convergencia hacia una forma colmena unificada"
        : id === "star-grass"
        ? "Fusión con coral lumínico estelar"
        : "Posible mineralización completa · estasis eterna",
    },
    magic: {
      affinities: [
        { name: "Naturaleza", v: id === "star-grass" ? 88 : id === "black-vine" ? 70 : id === "eclipse-flower" ? 62 : 78 },
        { name: "Luz", v: id === "star-grass" ? 96 : id === "eclipse-flower" ? 80 : id === "black-vine" ? 12 : 28 },
        { name: "Oscuridad", v: id === "black-vine" ? 94 : id === "eclipse-flower" ? 86 : id === "crow-root" ? 76 : 22 },
        { name: "Elemental", v: id === "crow-root" ? 92 : id === "star-grass" ? 64 : id === "eclipse-flower" ? 58 : 48 },
        { name: "Astral", v: id === "eclipse-flower" ? 98 : id === "star-grass" ? 84 : id === "black-vine" ? 40 : 36 },
      ],
      capacity: {
        absorption: plant.energy.absorption,
        production: plant.powers.magicProd,
        control: plant.powers.envControl,
      },
      notes: id === "eclipse-flower"
        ? "Genera campos de baja gravedad localizados; cataliza hechizos lunares de rango IX."
        : id === "black-vine"
        ? "Sintetiza neurotoxinas mágicas; sus zarcillos canalizan conjuros de constricción."
        : id === "star-grass"
        ? "Convierte radiación bruta en éter refinado; resuena con la magia solar."
        : "Ancla geomántica natural; los rituales invocados sobre ella perduran décadas.",
    },
    culture: {
      religion: id === "eclipse-flower" ? "Adorada por los Eclesiastas del Eclipse y la Casa Áurea"
        : id === "black-vine" ? "Tabú entre los Druidas Solares · venerada por la Hermandad del Velo"
        : id === "star-grass" ? "Sagrada para monjes solares de Aurea"
        : "Temida y respetada por todas las civilizaciones subterráneas",
      symbols: id === "eclipse-flower" ? ["☽", "✦", "Ω"]
        : id === "black-vine" ? ["⊗", "♆", "Σ"]
        : id === "star-grass" ? ["☀", "✧", "Σ"]
        : ["⏃", "Δ", "Ω"],
      traditions: id === "eclipse-flower"
        ? "Cosecha ritual durante el séptimo eclipse del ciclo"
        : id === "black-vine"
        ? "Pacto de sangre con el cultivador en la primera floración"
        : id === "star-grass"
        ? "Quema controlada al solsticio · ofrenda al sol"
        : "Ofrenda anual de un objeto largamente amado",
      myths: id === "eclipse-flower"
        ? "«Quien escuche su pétalo caer, oirá el final del cosmos»"
        : id === "black-vine"
        ? "«Cuenta que recuerda a cada víctima por su latido»"
        : id === "star-grass"
        ? "«Se dice que el primer sol aprendió a brillar imitando su espiga»"
        : "«Si la oyes respirar, ya estás dentro»",
    },
    research: {
      progress: id === "eclipse-flower" ? 75 : id === "black-vine" ? 90 : id === "star-grass" ? 100 : 55,
      pending: id === "eclipse-flower"
        ? ["Mecanismo de inversión gravitacional", "Cartografía completa del núcleo"]
        : id === "black-vine"
        ? ["Origen de las fibras musculares", "Resistencia genética al fuego"]
        : id === "star-grass"
        ? ["Variante alpha confirmada"]
        : ["Profundidad real del sistema radicular", "Edad exacta del espécimen ápice", "Existencia de su flor"],
      hypotheses: id === "eclipse-flower"
        ? "Podría ser un parásito estelar interdimensional disfrazado de planta"
        : id === "black-vine"
        ? "Probablemente comparte ascendencia con organismos fúngicos extintos"
        : id === "star-grass"
        ? "Posible relación con esporas estelares pre-cósmicas"
        : "Quizá no sea una planta — sino un organismo geológico-vegetal único",
      investigators: plant.research.explorers,
    },
    secret: {
      lost: id === "eclipse-flower"
        ? "El espécimen #003 desapareció con su laboratorio entero en 4.812"
        : id === "black-vine"
        ? "Reportes borrados de Nyx-7 mencionan inteligencia colectiva incipiente"
        : id === "star-grass"
        ? "Una pradera entera se extinguió sin causa registrada en el Borde Solar"
        : "Tres expediciones completas devoradas · cartografía sellada",
      experiments: id === "eclipse-flower"
        ? "Intento de hibridación con Ouroboros Astral · resultado clasificado"
        : id === "black-vine"
        ? "Cultivo militar abortado · serie M-Velo-IX"
        : id === "star-grass"
        ? "Reactor orgánico Helios-Π · prototipo perdido"
        : "Excavación rota · sello geomántico permanente",
      forbidden: id === "eclipse-flower"
        ? "Variante «Ojo Eclíptico» — capaz de mirar de vuelta"
        : id === "black-vine"
        ? "Variante «Madre» — tamaño insular, jamás dormida"
        : id === "star-grass"
        ? "Variante «Última Estrella» — quemó tres continentes"
        : "Variante «Garganta del Mundo» — abre dimensiones",
      clearance: id === "crow-root" ? "Ω+ · ARZ-PROHIBIDA"
        : id === "eclipse-flower" ? "Ω · Acceso restringido"
        : id === "black-vine" ? "Σ · Sólo Sello Negro"
        : "A+ · Acceso controlado",
    },
    biology: {
      cells: id === "eclipse-flower" ? "Citoplasma cristalino con inclusiones de antimateria estable"
        : id === "black-vine" ? "Células musculares vegetales con miofibrillas contráctiles"
        : id === "star-grass" ? "Cloroplastos fotovoltaicos de doble membrana"
        : "Células lignificadas con vetas metálicas activas",
      composition: id === "eclipse-flower" ? "Carbono · Silicio cristalino · Plata estelar"
        : id === "black-vine" ? "Carbono · Quitina vegetal · Toxinas alcalinas"
        : id === "star-grass" ? "Carbono · Silicio fotónico · Helio condensado"
        : "Carbono · Hierro vegetal · Ácidos digestivos",
      adaptations: id === "eclipse-flower" ? "Fototropismo eclíptico · tolerancia a 0 G"
        : id === "black-vine" ? "Termotropismo activo · regeneración acelerada"
        : id === "star-grass" ? "Resistencia a radiación 6.2 Sv/h"
        : "Termorregulación interna · camuflaje absoluto",
      unique: id === "eclipse-flower" ? "Único organismo conocido capaz de invertir su gradiente gravitacional"
        : id === "black-vine" ? "Único vegetal con tejido motor verdadero"
        : id === "star-grass" ? "Única hierba bioluminiscente con metabolismo nuclear"
        : "Único depredador con metabolismo geológico",
      process: id === "eclipse-flower" ? "Fotosíntesis inversa · captura radiación lunar"
        : id === "black-vine" ? "Heterotrofia activa · digiere presas vivas"
        : id === "star-grass" ? "Fotosíntesis radiativa de alta energía"
        : "Quimiotrofia abisal · digestión lenta de tejidos animales",
    },
  };
}

/* ===================== MODULE METADATA (encyclopedia architecture) ===================== */

export interface NavItem { slug: string; label: string; cn: string; icon: string; }

/** Internal navigation of the Flora module. `icon` is a lucide name resolved in the UI. */
export const FLORA_NAV: NavItem[] = [
  { slug: "/", label: "Inicio", cn: "首页", icon: "Home" },
  { slug: "/catalogo", label: "Catálogo de especies", cn: "物种目录", icon: "Boxes" },
  { slug: "/clasificacion", label: "Clasificación botánica", cn: "分类", icon: "GitBranch" },
  { slug: "/ecosistemas", label: "Ecosistemas", cn: "生态系", icon: "Globe2" },
  { slug: "/legendarias", label: "Plantas legendarias", cn: "传奇", icon: "Sparkles" },
  { slug: "/prohibidas", label: "Plantas prohibidas", cn: "禁忌", icon: "Lock" },
  { slug: "/alquimia", label: "Alquimia", cn: "炼金", icon: "FlaskRound" },
  { slug: "/recursos", label: "Recursos naturales", cn: "资源", icon: "Gem" },
  { slug: "/descubrimientos", label: "Descubrimientos", cn: "发现", icon: "Telescope" },
  { slug: "/expediciones", label: "Expediciones", cn: "远征", icon: "Compass" },
];

/** Sister modules of the universal encyclopedia (future-ready). */
export const ENCYCLOPEDIA_MODULES = [
  { id: "flora", label: "Flora", cn: "植物", icon: "Leaf", active: true },
  { id: "fauna", label: "Fauna", cn: "动物", icon: "PawPrint", active: false },
  { id: "minerales", label: "Minerales", cn: "矿物", icon: "Gem", active: false },
  { id: "criaturas", label: "Criaturas mágicas", cn: "魔兽", icon: "Bird", active: false },
  { id: "lugares", label: "Lugares", cn: "地点", icon: "Map", active: false },
  { id: "historia", label: "Historia", cn: "历史", icon: "History", active: false },
  { id: "artefactos", label: "Artefactos", cn: "神器", icon: "Swords", active: false },
  { id: "magia", label: "Magia", cn: "魔法", icon: "Sparkles", active: false },
  { id: "civilizaciones", label: "Civilizaciones", cn: "文明", icon: "Landmark", active: false },
] as const;

/** 12-tier existence / classification scale. */
export interface ClassLevel { roman: string; n: number; name: string; cn: string; tone: string; desc: string; }
export const CLASSIFICATION_LEVELS: ClassLevel[] = [
  { roman: "I", n: 1, name: "Terrenal", cn: "尘世", tone: "oklch(0.72 0.10 145)", desc: "Vida común, sin firma mágica perceptible." },
  { roman: "II", n: 2, name: "Vital", cn: "生机", tone: "oklch(0.74 0.12 150)", desc: "Bioenergía estable, leve resonancia natural." },
  { roman: "III", n: 3, name: "Resonante", cn: "共鸣", tone: "oklch(0.76 0.13 165)", desc: "Emite y absorbe éter ambiental de forma medible." },
  { roman: "IV", n: 4, name: "Áureo", cn: "金辉", tone: "oklch(0.80 0.14 110)", desc: "Concentración mágica visible; valor alquímico alto." },
  { roman: "V", n: 5, name: "Mágnum", cn: "巨力", tone: "oklch(0.82 0.15 95)", desc: "Capaz de alterar microclimas locales." },
  { roman: "VI", n: 6, name: "Astral", cn: "星界", tone: "oklch(0.80 0.15 250)", desc: "Vínculo con energías estelares y de marea." },
  { roman: "VII", n: 7, name: "Arcano Mayor", cn: "大奥术", tone: "oklch(0.74 0.17 290)", desc: "Manipula leyes arcanas; cultivo restringido." },
  { roman: "VIII", n: 8, name: "Soberano", cn: "君主", tone: "oklch(0.70 0.19 300)", desc: "Domina su ecosistema; conciencia incipiente." },
  { roman: "IX", n: 9, name: "Celestial", cn: "天界", tone: "oklch(0.78 0.16 320)", desc: "Semi-divino; reescribe el entorno a su voluntad." },
  { roman: "X", n: 10, name: "Primigenio", cn: "原始", tone: "oklch(0.74 0.18 40)", desc: "Más antiguo que los reinos; memoria geológica." },
  { roman: "XI", n: 11, name: "Infinito", cn: "无限", tone: "oklch(0.80 0.18 200)", desc: "Energía sin límite registrado; paradoja viva." },
  { roman: "XII", n: 12, name: "Eterno", cn: "永恒", tone: "oklch(0.92 0.10 200)", desc: "Fuera del tiempo. Solo teorizado, jamás confirmado." },
];

export const levelNumber = (level: string): number => {
  const map: Record<string, number> = { I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12 };
  const m = level.replace("Nivel", "").trim();
  return map[m] ?? 0;
};

export const getPlant = (id: string): Plant | undefined => PLANTS.find((p) => p.id === id);

/** Rarity tone keyword for UI tinting. */
export const rarityTone = (rarity: string): string => {
  if (/Mítica|Ω/.test(rarity)) return "oklch(0.78 0.16 320)";
  if (/Legendaria/.test(rarity)) return "oklch(0.74 0.18 40)";
  if (/Épica|Σ/.test(rarity)) return "oklch(0.70 0.19 300)";
  if (/Rara/.test(rarity)) return "oklch(0.80 0.14 200)";
  return "oklch(0.74 0.12 150)";
};
