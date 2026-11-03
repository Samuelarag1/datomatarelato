import type { Metadata } from "next";
import { Suspense } from "react";
import { BlockSkeleton, PageShell, PageTitle } from "@/components/editorial/blocks";
import { TopicCards } from "@/components/place/topic-cards";
import { getPoblacion } from "@/lib/data/poblacion";
import { placeFromParams } from "@/lib/data/place";
import { getTopicSummary, summaryDescription } from "@/lib/data/resumen";
import { formatPopulation } from "@/lib/format/es-ar";
import { CITIES, REGIONS, type Place } from "@/lib/places";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lugar]">): Promise<Metadata> {
  const place = await placeFromParams(params);
  return pageMetadata({
    title: place.name,
    description: summaryDescription(await getTopicSummary(place), `Precios, ingresos y pobreza ${place.inName}, con datos oficiales.`),
    path: `/${place.slug}`,
  });
}

async function Population({ place }: { place: Place }) {
  const data = await getPoblacion(place);
  if (!data) return null;
  return (
    <p className="mb-6 text-[15px] text-ink-2">
      Viven unas <span className="font-medium text-ink">{formatPopulation(data.value)} de personas</span>, según la
      estimación del INDEC para {data.year}.
    </p>
  );
}

function coverageNote(place: Place): string {
  if (!place.region) return "Elegí tu provincia arriba para ver el dato más cercano a tu lugar.";
  const cities = place.cities.map((city) => CITIES[city]).join(", ");
  return `Precios y canasta básica: región ${REGIONS[place.region].name}. Pobreza: ${cities}. Salario mínimo y jubilaciones: todo el país.`;
}

async function Content({ params }: { params: Promise<{ lugar: string }> }) {
  const place = await placeFromParams(params);
  const summary = await getTopicSummary(place);

  return (
    <>
      <PageTitle title={place.name} note={coverageNote(place)} />
      <Suspense>
        <Population place={place} />
      </Suspense>
      <TopicCards place={place} summary={summary} />
    </>
  );
}

export default function PlacePage({ params }: PageProps<"/[lugar]">) {
  return (
    <PageShell>
      <Suspense fallback={<BlockSkeleton height={320} />}>
        <Content params={params} />
      </Suspense>
    </PageShell>
  );
}
