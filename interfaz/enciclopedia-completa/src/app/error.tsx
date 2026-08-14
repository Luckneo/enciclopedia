"use client";

import { useEffect } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => reportLovableError(error, { boundary: "next_root_error" }), [error]);
  return <main className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-xl font-semibold">Esta sección no pudo cargarse</h1><p className="mt-2 text-sm text-muted-foreground">Ocurrió un error. Puedes reintentar o volver al NEXUS.</p><div className="mt-6 flex justify-center gap-2"><button onClick={reset} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Reintentar</button><a href="/" className="rounded-md border px-4 py-2">Volver</a></div></div></main>;
}
