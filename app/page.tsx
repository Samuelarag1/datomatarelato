import Link from "next/link";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/editorial/blocks";
import { HomeTopics } from "@/components/place/home-topics";
import { PlacePicker } from "@/components/place/place-picker";
import { getAllSummaries } from "@/lib/data/resumen";
import { SITE } from "@/lib/site";

async function Topics() {
  return <HomeTopics summaries={await getAllSummaries()} />;
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-12">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{SITE.tagline}</h1>
          <p className="mt-3 text-xl text-ink-2">{SITE.slogan}</p>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
            {SITE.name} toma datos oficiales del INDEC y de otros organismos públicos y los explica en lenguaje simple:
            cuánto suben los precios, si los ingresos alcanzan y cuánta gente vive bajo la línea de pobreza.
          </p>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-ink-2">
            Elegí tu provincia para ver los datos de tu lugar. Cada número te dice qué mide y de dónde sale.
          </p>
        </div>
        <PlacePicker />
      </section>

      <section className="mt-14">
        <Suspense fallback={<BlockSkeleton height={320} />}>
          <Topics />
        </Suspense>
      </section>

      <section className="mt-14 max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight">Qué vas a ver según tu lugar</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          No todos los datos existen por provincia, y preferimos decirlo antes que inventar un número. Usamos siempre el
          más cercano a tu lugar:
        </p>
        <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5 text-[15px]">
          <dt className="font-medium">Por región</dt>
          <dd className="text-ink-2">precios y canasta básica</dd>
          <dt className="font-medium">Por ciudad</dt>
          <dd className="text-ink-2">pobreza</dd>
          <dt className="font-medium">Todo el país</dt>
          <dd className="text-ink-2">sueldos, salario mínimo y jubilaciones</dd>
        </dl>
        <p className="mt-4 text-[15px]">
          <Link href="/metodologia" className="text-link hover:underline">
            Cómo trabajamos y de dónde salen los datos
          </Link>
        </p>
      </section>
    </div>
  );
}
