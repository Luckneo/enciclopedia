import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-7xl font-bold">404</h1><h2 className="mt-4 text-xl font-semibold">Página no encontrada</h2><p className="mt-2 text-sm text-muted-foreground">La sección que buscas no existe o fue movida.</p><Link href="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">Volver al NEXUS</Link></div></main>;
}
