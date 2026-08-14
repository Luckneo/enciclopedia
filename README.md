# Enciclopedia Planetaria

Enciclopedia personal para construcción de mundos, bestiario, flora, minerales,
personajes y sistemas RPG. Incluye una interfaz web consolidada, una aplicación
de escritorio PyQt y acceso paginado a Supabase.

## Interfaz web

La aplicación canónica se encuentra en `interfaz/enciclopedia-completa`.

```powershell
cd interfaz/enciclopedia-completa
npm install
npm run dev
```

Variables necesarias (consulta `.env.example`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

La clave publicable solo tiene acceso de lectura mediante las políticas RLS de
Supabase. No se deben añadir claves `service_role` al frontend.

## Despliegue

Vercel debe usar `interfaz/enciclopedia-completa` como Root Directory. El build
es `npm run build`; Nitro selecciona automáticamente el preset de Vercel.

## Modo local

`Iniciar_Interfaz.bat` mantiene disponible el servidor Node local. Si no se
configura Supabase, la interfaz utiliza la API local de solo lectura sobre
`encyclopedia.db`. La base SQLite y sus respaldos están excluidos de Git.

## Pruebas

```powershell
python -m unittest discover -s tests -v
```
