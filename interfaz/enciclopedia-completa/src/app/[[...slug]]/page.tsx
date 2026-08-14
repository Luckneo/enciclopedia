"use client";

import { notFound, usePathname } from "next/navigation";
import { Route as Home } from "@/routes/index";
import { Route as ArchivoReal } from "@/routes/archivo-real";
import { Route as Alquimia } from "@/routes/alquimia";
import { Route as Bestiary } from "@/routes/bestiary";
import { Route as Catalogo } from "@/routes/catalogo";
import { Route as Characters } from "@/routes/characters";
import { Route as Clasificacion } from "@/routes/clasificacion";
import { Route as Descubrimientos } from "@/routes/descubrimientos";
import { Route as Ecosistemas } from "@/routes/ecosistemas";
import { Route as Expediciones } from "@/routes/expediciones";
import { Route as Flora } from "@/routes/flora";
import { Route as Legendarias } from "@/routes/legendarias";
import { Route as Locations } from "@/routes/locations";
import { Route as Planet } from "@/routes/planet";
import { Route as Prohibidas } from "@/routes/prohibidas";
import { Route as Recursos } from "@/routes/recursos";
import { Route as City } from "@/routes/city.$id";
import { Route as Continent } from "@/routes/continent.$id";
import { Route as Forbidden } from "@/routes/forbidden.$id";
import { Route as Hemisphere } from "@/routes/hemisphere.$id";
import { Route as MacroRegion } from "@/routes/macro-region.$id";
import { Route as Nation } from "@/routes/nation.$id";
import { Route as Natural } from "@/routes/natural.$id";
import { Route as SuperContinent } from "@/routes/super-continent.$id";

type CompatRoute = { options: { component?: React.ComponentType } };

const exactRoutes: Record<string, CompatRoute> = {
  "/": Home,
  "/archivo-real": ArchivoReal,
  "/alquimia": Alquimia,
  "/bestiary": Bestiary,
  "/catalogo": Catalogo,
  "/characters": Characters,
  "/clasificacion": Clasificacion,
  "/descubrimientos": Descubrimientos,
  "/ecosistemas": Ecosistemas,
  "/expediciones": Expediciones,
  "/flora": Flora,
  "/legendarias": Legendarias,
  "/locations": Locations,
  "/planet": Planet,
  "/prohibidas": Prohibidas,
  "/recursos": Recursos,
};

const dynamicRoutes: Record<string, CompatRoute> = {
  city: City,
  continent: Continent,
  forbidden: Forbidden,
  hemisphere: Hemisphere,
  "macro-region": MacroRegion,
  nation: Nation,
  natural: Natural,
  "super-continent": SuperContinent,
};

export default function RouteCompatibilityPage() {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean)[0];
  const route = exactRoutes[pathname] ?? dynamicRoutes[segment];
  const Component = route?.options.component;
  if (!Component) notFound();
  return <Component />;
}
