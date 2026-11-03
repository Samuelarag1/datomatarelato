import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SITE } from "@/lib/site";
import "./globals.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}: ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: `Precios, ingresos y pobreza en tu provincia, con datos oficiales explicados en lenguaje simple. ${SITE.slogan}`,
  openGraph: { siteName: SITE.name, locale: "es_AR", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Algunas extensiones del navegador agregan atributos a estas etiquetas antes de que React las tome.
    <html lang="es-AR" className={`${plex.variable} antialiased`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col" suppressHydrationWarning>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-surface"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
