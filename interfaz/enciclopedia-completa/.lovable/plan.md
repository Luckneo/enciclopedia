
# Encyclopedia Universal — Location Archive

Transform the current single-page planet view into a **complete multi-module exploration system** where each geographic scale has its own dedicated, distinct interface — connected by a global hierarchy navigator.

## Architecture

Move from one-page-many-tabs to **route-based modules**, each with its own layout and visualization language, sharing a common dark design system.

```text
/                       → Hierarchy Explorer (entry point)
/planet                 → Module 1: Planet
/hemisphere/:id         → Module 2: Hemisphere
/macro-region/:id       → Module 3: Macro Region
/super-continent/:id    → Module 4: Super Continent
/continent/:id          → Module 5: Continent / Region
/nation/:id             → Module 6: Nation
/city/:id               → Module 7: City
/natural/:id            → Module 8: Natural Location
/forbidden/:id          → Module 9: Forbidden Location
```

A persistent **HierarchyRail** (left side, collapsible) shows the zoom chain: Planet → Hemisphere → Region → … → Location, with breadcrumbs and a "zoom out / dive deeper" affordance.

## Modules (each visually distinct)

1. **Planet** — 3D orbiting globe (CSS sphere + atmosphere glow), solar system mini-orrery, internal-layers cutaway (atmosphere → core), political map, threat heatmap.
2. **Hemisphere** — half-globe hero, climate band chart, civilization density grid, ecosystem rings.
3. **Macro Region** — terrain topology stripes, ecosystem layer stack, resource distribution bars, phenomena pins.
4. **Super Continent** — landmass silhouette with tectonic vectors, geological column, sub-region nodes, resource matrix.
5. **Continent / Region** — detailed map grid with mountains/forests/rivers icons, settlement clusters.
6. **Nation** — territory shield + flag, political/cultural/economic toggle maps, gov + population stat blocks.
7. **City** — isometric aerial grid, district color zones, landmark list with coordinates.
8. **Natural Location** — panoramic landscape band, vertical cross-section (canopy/ground/roots etc.), ecosystem analysis.
9. **Forbidden Location** — red-shifted threat HUD, anomaly waveform, redacted expedition logs, danger meter.

## Design System

Shared tokens (already in `styles.css`) + new reusable primitives in `src/components/encyclopedia/`:

- `PlanetPanel`, `MapPanel`, `DataWindow`, `ExplorationCard`, `StatusIndicator`, `ThreatIndicator`, `Timeline`, `HierarchyRail`, `ModuleHeader`, `CrossSection`, `StatGrid`.

Each module composes these primitives differently so the language is shared but each scale feels unique.

## Data Model

`src/data/world.ts` — single source of truth:

```ts
type LocationType = "planet" | "hemisphere" | "macro" | "super-continent"
  | "continent" | "nation" | "city" | "natural" | "forbidden";

interface Location {
  id; name; type: LocationType;
  parentId?; childrenIds: string[];
  coordinates?; image; maps?: string[];
  history; climate?; population?; resources?: string[];
  threatLevel: 0-10; tags: string[]; description; era?;
}
```

Seed with Aelyn-VII content: planet → 2 hemispheres → 3 macro regions → 2 super-continents → continents → nations → cities + scattered natural + forbidden locations (~25 entries to feel populated, structure ready for thousands).

## Implementation Steps

1. **Routing**: Add route files under `src/routes/` for each module (`planet.tsx`, `hemisphere.$id.tsx`, …). Keep `index.tsx` as the Hierarchy Explorer.
2. **Data layer**: Create `src/data/world.ts` with the typed seed graph + lookup helpers (`getById`, `getChildren`, `getAncestry`).
3. **Shared primitives**: Build encyclopedia components under `src/components/encyclopedia/` reusing existing glass/dark tokens from `styles.css`.
4. **Hierarchy Explorer (index)**: Replace current index with a 3-column cinematic map: left = vertical hierarchy chain, center = featured planet preview, right = quick-jump cards for each scale.
5. **Module pages**: Implement each of the 9 modules with its own composition + visualization. Reuse generated planet imagery as backdrops.
6. **HierarchyRail**: Persistent left rail (rendered from `__root.tsx` or a layout route) showing the current zoom chain with click-to-jump.
7. **Transitions**: Add framer-motion fade/scale on route change to evoke zooming.
8. **Cleanup**: Retire `EncyclopediaDashboard`'s monolithic tab structure; salvage panels into module pages.

## Technical Details

- TanStack Router file-based routes; dynamic params with `$id`.
- `Link` components with `params={{ id }}` (no string interpolation).
- Each route sets its own `head()` metadata.
- Visualizations are pure CSS/SVG (no Three.js); planet uses gradient sphere + rotating `::before` cloud layer.
- All colors via semantic tokens; no hardcoded hex in components.
- Framer-motion for zoom-in/out transitions between scales.

## Out of Scope

- Real 3D (WebGL/Three.js).
- Backend persistence (data is in-memory seed; structure is ready to swap to Lovable Cloud later).
- Search/filter UI (can be added after the modules ship).
