# Despliegue web

Esta carpeta es la aplicación canónica desplegada en Vercel.

- Root Directory: `interfaz/enciclopedia-completa`
- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: dejar vacío (Vercel detecta `.next`)
- Datos: Supabase mediante `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

El código Python y SQLite de la raíz pertenecen únicamente al modo local y Vercel no debe detectarlo.
