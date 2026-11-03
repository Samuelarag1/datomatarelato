import Link from "next/link";
import type { TopicStat, TopicSummary } from "@/lib/data/resumen";
import type { Place } from "@/lib/places";

function Card({
  title,
  description,
  href,
  linkLabel,
  stat,
}: {
  title: string;
  description?: string;
  href: string;
  linkLabel: string;
  stat: TopicStat | null;
}) {
  return (
    <article className="flex flex-col rounded-lg border border-rule p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-1 text-[15px] leading-snug text-ink-2">{description}</p> : null}
      {stat ? (
        <div className="mt-4">
          <p className="text-3xl font-semibold tracking-tight">{stat.value}</p>
          <p className="mt-1 text-[15px] leading-snug text-ink-2">{stat.text}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-3">El último dato no está disponible en este momento.</p>
      )}
      <Link href={href} className="mt-auto pt-4 text-sm font-medium text-link hover:underline">
        {linkLabel}
      </Link>
    </article>
  );
}

/** Los tres temas del sitio con su último dato para un lugar. Las descripciones son para el inicio. */
export function TopicCards({
  place,
  summary,
  describe = false,
}: {
  place: Place;
  summary: TopicSummary;
  describe?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card
        title="Precios"
        description={describe ? "Cuánto suben los precios, qué aumentó más y cuánto cuestan las cosas de todos los días." : undefined}
        href={`/${place.slug}/precios`}
        linkLabel="Ver precios"
        stat={summary.precios}
      />
      <Card
        title="¿Alcanza?"
        description={describe ? "Cuánto de lo básico cubren el salario mínimo y la jubilación mínima, y si los sueldos le ganan a los precios." : undefined}
        href={`/${place.slug}/alcanza`}
        linkLabel="Ver si alcanza"
        stat={summary.alcanza}
      />
      <Card
        title="Pobreza"
        description={describe ? "Cuánta gente está bajo la línea de pobreza en tu ciudad y cuánto necesita un hogar como el tuyo." : undefined}
        href={`/${place.slug}/pobreza`}
        linkLabel="Ver pobreza"
        stat={summary.pobreza}
      />
    </div>
  );
}
