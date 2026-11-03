import type { Metadata } from "next";

const name = "Argentina al Desnudo";
const slogan = "Entendé lo que pasa. Descubrí lo que cambia.";

// El nombre se cambia acá. El ícono está en app/icon.svg y la imagen para compartir, en components/og.
export const SITE = {
  name,
  slogan,
  title: `${name}: datos oficiales en lenguaje simple`,
  description: `${slogan} Precios, ingresos y pobreza en tu provincia, con datos oficiales explicados en lenguaje simple.`,
};

/** La dirección pública, para los enlaces a las imágenes al compartir. Se define al publicar, con SITE_URL. */
export function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

/** Lo que muestran los buscadores y las redes al compartir una página. La imagen sale de su opengraph-image. */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE.name, locale: "es_AR", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}
