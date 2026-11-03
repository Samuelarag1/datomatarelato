"use client";

import type { TopicSummary } from "@/lib/data/resumen";
import { COUNTRY, placeLabel } from "@/lib/places";
import { TopicCards } from "./topic-cards";
import { usePlace } from "./use-place";

/** El inicio no tiene lugar en la URL: muestra el elegido. Sin elección, todo el país. */
export function HomeTopics({ summaries }: { summaries: Record<string, TopicSummary> }) {
  const place = usePlace().saved ?? COUNTRY;

  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">Qué vas a encontrar</h2>
      <p className="mt-1 mb-5 text-[15px] text-ink-3">Último dato para {placeLabel(place)}.</p>
      <TopicCards place={place} summary={summaries[place.slug]} describe />
    </>
  );
}
