import planetImg from "@/assets/creature-egg.jpg";
import hemisphereImg from "@/assets/creature-world.jpg";
import coreImg from "@/assets/creature-core.jpg";
import continentImg from "@/assets/creature-main.jpg";
import forbiddenImg from "@/assets/creature-evolution.jpg";

export type LocationType =
  | "planet"
  | "hemisphere"
  | "macro"
  | "super-continent"
  | "continent"
  | "nation"
  | "city"
  | "natural"
  | "forbidden";

export interface Location {
  id: string;
  name: string;
  cn?: string;
  type: LocationType;
  parentId?: string;
  childrenIds: string[];
  coordinates?: string;
  image: string;
  history: string;
  description: string;
  climate?: string;
  population?: string;
  resources?: string[];
  threatLevel: number; // 0–10
  tags: string[];
  era?: string;
  accent: string; // oklch color
}

const A = {
  gold: "oklch(0.78 0.13 80)",
  cyan: "oklch(0.78 0.14 200)",
  green: "oklch(0.72 0.16 145)",
  violet: "oklch(0.68 0.18 290)",
  crimson: "oklch(0.62 0.22 25)",
  amber: "oklch(0.74 0.16 60)",
  ice: "oklch(0.82 0.08 220)",
};

export const routeFor: Record<LocationType, string> = {
  planet: "/planet",
  hemisphere: "/hemisphere",
  macro: "/macro-region",
  "super-continent": "/super-continent",
  continent: "/continent",
  nation: "/nation",
  city: "/city",
  natural: "/natural",
  forbidden: "/forbidden",
};

export const typeLabel: Record<LocationType, string> = {
  planet: "Planeta",
  hemisphere: "Hemisferio",
  macro: "Macro Región",
  "super-continent": "Súper Continente",
  continent: "Continente",
  nation: "Nación",
  city: "Ciudad",
  natural: "Ubicación Natural",
  forbidden: "Zona Prohibida",
};

export const typeCN: Record<LocationType, string> = {
  planet: "CÓSMICO",
  hemisphere: "REGIONAL",
  macro: "MACROBIOMA",
  "super-continent": "PLACA TECTÓNICA",
  continent: "GEOGRÁFICO",
  nation: "GEOPOLÍTICO",
  city: "URBANO",
  natural: "BIÓSFERA",
  forbidden: "ANOMALÍA",
};

export const locations: Location[] = [
  {
    id: "aelyn-vii",
    name: "Aelyn-VII",
    cn: "艾林七",
    type: "planet",
    childrenIds: ["hem-north", "hem-south"],
    coordinates: "Sector Ω-04 · Orbit 1.06 AU",
    image: planetImg,
    history:
      "Catalogued in cycle 3.412 by the Veilward Survey. Atmospheric composition stabilised after the Long Burn.",
    description:
      "A temperate super-Earth orbiting a binary K-class system. Three moons, two civilisations, one anomaly.",
    climate: "Temperate · 12 climate bands",
    population: "4.8 B sentient",
    resources: ["Iridium", "Aetherium", "Deep Water"],
    threatLevel: 6,
    tags: ["Living World", "Habitable", "Anomaly Present"],
    era: "Third Cycle",
    accent: A.gold,
  },
  /* HEMISPHERES */
  {
    id: "hem-north",
    name: "Boreal Hemisphere",
    cn: "北半球",
    type: "hemisphere",
    parentId: "aelyn-vii",
    childrenIds: ["macro-tundra", "macro-spires"],
    coordinates: "0° → 90° N",
    image: hemisphereImg,
    history: "Ice-capped half of Aelyn-VII. Home to the oldest standing civilisations.",
    description: "Cold, mountainous, dense with civilisation along the meridian belt.",
    climate: "Cold · Boreal · Tundra",
    population: "2.1 B",
    resources: ["Glacier Salt", "Sky-iron"],
    threatLevel: 4,
    tags: ["Boreal", "Densely Populated"],
    accent: A.ice,
  },
  {
    id: "hem-south",
    name: "Austral Hemisphere",
    cn: "南半球",
    type: "hemisphere",
    parentId: "aelyn-vii",
    childrenIds: ["macro-verdant", "macro-redwastes"],
    coordinates: "0° → 90° S",
    image: continentImg,
    history: "Tropical and arid mirror to the north. Cradle of the Verdant Compact.",
    description: "Lush rainforests, red deserts, oceanic trenches.",
    climate: "Tropical · Arid",
    population: "2.7 B",
    resources: ["Heliwood", "Solar Crystal"],
    threatLevel: 5,
    tags: ["Tropical", "Biodiverse"],
    accent: A.green,
  },
  /* MACRO REGIONS */
  {
    id: "macro-tundra",
    name: "Frostmere Expanse",
    cn: "霜域",
    type: "macro",
    parentId: "hem-north",
    childrenIds: ["sc-northcradle"],
    image: hemisphereImg,
    history: "An unbroken frozen plain stretching from pole to forty-five degrees.",
    description: "Permafrost over a buried ocean. Magnetic anomalies common.",
    climate: "Sub-arctic",
    resources: ["Ice Cores", "Buried Methane"],
    threatLevel: 5,
    tags: ["Cryosphere"],
    accent: A.ice,
  },
  {
    id: "macro-spires",
    name: "Iron Spires",
    cn: "铁峰",
    type: "macro",
    parentId: "hem-north",
    childrenIds: ["sc-northcradle"],
    image: coreImg,
    history: "A mountain chain forged in tectonic upheaval. Hollow throughout.",
    description: "Vertical ecosystem, ten-kilometre peaks, internal labyrinths.",
    climate: "Alpine",
    resources: ["Sky-iron", "Aetherium"],
    threatLevel: 7,
    tags: ["Mountainous", "Hollow"],
    accent: A.gold,
  },
  {
    id: "macro-verdant",
    name: "Verdant Belt",
    cn: "翠带",
    type: "macro",
    parentId: "hem-south",
    childrenIds: ["sc-southcradle"],
    image: continentImg,
    history: "Equatorial rainforest spanning two super-continents.",
    description: "Canopy three hundred metres tall. Self-aware in places.",
    climate: "Equatorial",
    resources: ["Heliwood", "Bioluminescent Spores"],
    threatLevel: 6,
    tags: ["Rainforest", "Sentient Flora"],
    accent: A.green,
  },
  {
    id: "macro-redwastes",
    name: "Red Wastes",
    cn: "赤荒",
    type: "macro",
    parentId: "hem-south",
    childrenIds: ["sc-southcradle"],
    image: forbiddenImg,
    history: "A desert scorched by the fall of the second moon.",
    description: "Iron-rich sands. Glass storms. Buried ruins.",
    climate: "Arid",
    resources: ["Solar Crystal", "Iron Glass"],
    threatLevel: 8,
    tags: ["Desert", "Ruined"],
    accent: A.crimson,
  },
  /* SUPER-CONTINENTS */
  {
    id: "sc-northcradle",
    name: "Northcradle Plate",
    cn: "北摇篮",
    type: "super-continent",
    parentId: "macro-tundra",
    childrenIds: ["cont-velgar", "cont-orinmar"],
    image: hemisphereImg,
    history: "Formed in the Second Cycle when the polar shelves fused.",
    description: "Two-thirds of the northern landmass on a single tectonic plate.",
    climate: "Cold continental",
    threatLevel: 5,
    tags: ["Tectonic"],
    accent: A.ice,
  },
  {
    id: "sc-southcradle",
    name: "Southcradle Plate",
    cn: "南摇篮",
    type: "super-continent",
    parentId: "macro-verdant",
    childrenIds: ["cont-aulen"],
    image: continentImg,
    history: "Younger, faster-drifting, and home to the deepest trench on Aelyn-VII.",
    description: "Two continents, one inland sea, one buried abyss.",
    climate: "Variable",
    threatLevel: 6,
    tags: ["Tectonic", "Active"],
    accent: A.green,
  },
  /* CONTINENTS */
  {
    id: "cont-velgar",
    name: "Velgar",
    cn: "维尔加",
    type: "continent",
    parentId: "sc-northcradle",
    childrenIds: ["nation-iskar", "nation-thaln", "nat-spire-forest"],
    image: hemisphereImg,
    history: "Cradle of the Iskari dynasties.",
    description: "Glaciated highlands feeding river-cities along three meridians.",
    climate: "Cold temperate",
    threatLevel: 4,
    tags: ["Civilised"],
    accent: A.ice,
  },
  {
    id: "cont-orinmar",
    name: "Orinmar",
    cn: "奥林玛",
    type: "continent",
    parentId: "sc-northcradle",
    childrenIds: ["forb-blackstep"],
    image: coreImg,
    history: "Smaller, jagged, and largely depopulated since the Hollow War.",
    description: "Iron spires and abandoned mining colonies.",
    climate: "Alpine",
    threatLevel: 7,
    tags: ["Abandoned"],
    accent: A.amber,
  },
  {
    id: "cont-aulen",
    name: "Aulen",
    cn: "奥伦",
    type: "continent",
    parentId: "sc-southcradle",
    childrenIds: ["nation-velhar", "nat-canopy", "forb-redmouth"],
    image: continentImg,
    history: "Founded by the Verdant Compact in the Third Cycle.",
    description: "Rainforest plateaus, river-states, one sentient grove.",
    climate: "Equatorial",
    threatLevel: 5,
    tags: ["Federated"],
    accent: A.green,
  },
  /* NATIONS */
  {
    id: "nation-iskar",
    name: "Iskar Dominion",
    cn: "伊斯卡",
    type: "nation",
    parentId: "cont-velgar",
    childrenIds: ["city-velhaim", "city-orran"],
    image: hemisphereImg,
    history: "A constitutional dominion ruled by the seven Iron Houses.",
    description: "Industrialised, militarised, three thousand kilometres of fortified meridian.",
    climate: "Cold continental",
    population: "412 M",
    resources: ["Sky-iron", "Coal"],
    threatLevel: 4,
    tags: ["Dominion", "Industrial"],
    accent: A.gold,
  },
  {
    id: "nation-thaln",
    name: "Thaln Conclave",
    cn: "塔伦",
    type: "nation",
    parentId: "cont-velgar",
    childrenIds: ["city-sehl"],
    image: coreImg,
    history: "A theocratic conclave perched on the river-cliffs of Velgar.",
    description: "Twelve city-states bound by the Conclave Oath.",
    population: "84 M",
    threatLevel: 3,
    tags: ["Theocracy"],
    accent: A.violet,
  },
  {
    id: "nation-velhar",
    name: "Velhar Compact",
    cn: "维尔哈",
    type: "nation",
    parentId: "cont-aulen",
    childrenIds: ["city-saen"],
    image: continentImg,
    history: "A federated democracy spanning the Verdant Belt.",
    description: "River-cities, canopy academies, an elected Speaker.",
    population: "1.1 B",
    threatLevel: 3,
    tags: ["Federation"],
    accent: A.green,
  },
  /* CITIES */
  {
    id: "city-velhaim",
    name: "Velhaim",
    cn: "维尔海姆",
    type: "city",
    parentId: "nation-iskar",
    childrenIds: [],
    coordinates: "48.2°N · 12.1°E",
    image: hemisphereImg,
    history: "Capital of the Iskar Dominion. Founded on the ruins of an older city.",
    description: "Vertical megacity of fourteen million, built into a cliff face.",
    population: "14.2 M",
    threatLevel: 3,
    tags: ["Capital", "Vertical"],
    accent: A.gold,
  },
  {
    id: "city-orran",
    name: "Orran",
    cn: "奥兰",
    type: "city",
    parentId: "nation-iskar",
    childrenIds: [],
    coordinates: "52.6°N · 18.4°E",
    image: coreImg,
    history: "A river-fortress turned trading hub.",
    description: "Three million, ringed by foundries.",
    population: "3.1 M",
    threatLevel: 4,
    tags: ["Industrial"],
    accent: A.amber,
  },
  {
    id: "city-sehl",
    name: "Sehl",
    cn: "塞尔",
    type: "city",
    parentId: "nation-thaln",
    childrenIds: [],
    coordinates: "44.0°N · 6.2°E",
    image: hemisphereImg,
    history: "Seat of the Conclave Oath.",
    description: "A cliff city of seminaries and observatories.",
    population: "820 K",
    threatLevel: 2,
    tags: ["Sacred"],
    accent: A.violet,
  },
  {
    id: "city-saen",
    name: "Saen",
    cn: "塞恩",
    type: "city",
    parentId: "nation-velhar",
    childrenIds: [],
    coordinates: "3.4°S · 64.1°W",
    image: continentImg,
    history: "Built into the canopy of the Verdant Belt.",
    description: "A city suspended on living wood.",
    population: "2.4 M",
    threatLevel: 4,
    tags: ["Arboreal"],
    accent: A.green,
  },
  /* NATURAL */
  {
    id: "nat-spire-forest",
    name: "The Spire Forest",
    cn: "尖塔森林",
    type: "natural",
    parentId: "cont-velgar",
    childrenIds: [],
    image: coreImg,
    history: "Petrified forest of crystalline trees, two kilometres tall.",
    description: "Canopy of light · ground of glass · roots reaching to the mantle.",
    climate: "Alpine",
    resources: ["Light Crystal"],
    threatLevel: 6,
    tags: ["Crystalline", "Vertical Ecosystem"],
    accent: A.cyan,
  },
  {
    id: "nat-canopy",
    name: "The Living Canopy",
    cn: "活树冠",
    type: "natural",
    parentId: "cont-aulen",
    childrenIds: [],
    image: continentImg,
    history: "A canopy that thinks, slowly, in pulses of bioluminescence.",
    description: "Three hundred metres tall · responsive · partially sentient.",
    climate: "Equatorial",
    resources: ["Heliwood", "Spore-Light"],
    threatLevel: 5,
    tags: ["Sentient Flora"],
    accent: A.green,
  },
  /* FORBIDDEN */
  {
    id: "forb-blackstep",
    name: "Blackstep Hollow",
    cn: "黑阶",
    type: "forbidden",
    parentId: "cont-orinmar",
    childrenIds: [],
    image: forbiddenImg,
    history:
      "Eleven expeditions entered. Two returned. Both refused to speak. Designated Class-Ω by the Veilward.",
    description: "A crater two kilometres deep with a voice at the bottom.",
    threatLevel: 10,
    tags: ["Class-Ω", "Unknown", "Anomaly"],
    accent: A.crimson,
  },
  {
    id: "forb-redmouth",
    name: "The Red Mouth",
    cn: "赤口",
    type: "forbidden",
    parentId: "cont-aulen",
    childrenIds: [],
    image: forbiddenImg,
    history: "A bleeding fissure that opened in 3.398. Output has only increased since.",
    description: "Continuously emits an unknown red aerosol. Quarantined within a 40-km ring.",
    threatLevel: 9,
    tags: ["Class-Ω", "Active"],
    accent: A.crimson,
  },
];

export const byId = new Map(locations.map((l) => [l.id, l]));

export function getById(id: string): Location | undefined {
  return byId.get(id);
}

export function getChildren(id: string): Location[] {
  const node = byId.get(id);
  if (!node) return [];
  return node.childrenIds.map((c) => byId.get(c)!).filter(Boolean);
}

export function getAncestry(id: string): Location[] {
  const chain: Location[] = [];
  let cur = byId.get(id);
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return chain;
}

export function linkFor(loc: Location): { to: string; params?: Record<string, string> } {
  if (loc.type === "planet") return { to: "/planet" };
  return { to: `${routeFor[loc.type]}/$id`, params: { id: loc.id } };
}

export const planet = locations.find((l) => l.type === "planet")!;
