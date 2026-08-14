import type { Metadata } from "next";
import "../styles.css";
import { EncyclopediaNavigator } from "@/components/navigation/EncyclopediaNavigator";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Enciclopedia Planetaria Universal",
  description: "Archivo de construcción de mundos, especies, personajes y sistemas RPG.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
        {children}
        <EncyclopediaNavigator />
        <Toaster position="bottom-left" richColors />
      </body>
    </html>
  );
}
