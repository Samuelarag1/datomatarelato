import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-rule">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Datos de fuentes oficiales, principalmente el INDEC. {SITE.name} no es un sitio del Estado.</p>
        <Link href="/metodologia" className="text-link hover:underline">
          Cómo trabajamos
        </Link>
      </div>
    </footer>
  );
}
