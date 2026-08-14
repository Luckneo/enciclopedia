# Módulos visuales heredados

Esta carpeta conserva las implementaciones visuales migradas desde TanStack Start.
Las rutas públicas reales están en `src/app/` y cada `page.tsx` carga únicamente su módulo.

`src/lib/router-compat.tsx` es un seam temporal para `Link`, parámetros y búsquedas. Al
modificar un módulo, prioriza `next/link` y las interfaces nativas de App Router para
reducir gradualmente ese adapter.
