"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { Suspense, type ComponentType } from "react";

type CompatRoute = { options: { component?: ComponentType } };

export function RouteScreen({ route }: { route: CompatRoute }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const Component = route.options.component;
  if (!Component) return null;
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        key={pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<div className="min-h-screen bg-background" aria-label="Cargando sección" />}>
          <Component />
        </Suspense>
      </m.div>
    </LazyMotion>
  );
}
