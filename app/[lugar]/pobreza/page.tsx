import type { Metadata } from "next";
import { BarList } from "@/components/charts/bar-list";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Suspense } from "react";
import { Answer, Block, BlockSkeleton, Facts, PageShell, PageTitle, Unavailable } from "@/components/editorial/blocks";
import { DataNote } from "@/components/editorial/data-note";
import { Guarded } from "@/components/editorial/guarded";
import { CityChart } from "@/components/pobreza/city-chart";
import { HouseholdCalculator } from "@/components/pobreza/household-calculator";
import { placeFromParams } from "@/lib/data/place";
import { getCiudades, getLineas, getPobreza } from "@/lib/data/pobreza";
import { getTopicSummary, statDescription } from "@/lib/data/resumen";
import { formatPercent, formatPeriod } from "@/lib/format/es-ar";
import { seriesTable, type ChartSeries } from "@/lib/format/tables";
import { CITIES, type Place } from "@/lib/places";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lugar]/pobreza">): Promise<Metadata> {
  const place = await placeFromParams(params);
  const { pobreza } = await getTopicSummary(place);
  return pageMetadata({
    title: `Pobreza · ${place.name}`,
    description: statDescription(pobreza, `Cuánta gente está bajo la línea de pobreza ${place.inName} y cuánto necesita un hogar como el tuyo.`),
    path: `/${place.slug}/pobreza`,
  });
}

function titleNote(place: Place) {
  if (!place.region) {
    return "El INDEC mide la pobreza en 31 ciudades grandes, no en todo el territorio. Elegí tu provincia para ver tu ciudad.";
  }
  const cities = place.cities.map((city) => CITIES[city]).join(", ");
  return `El INDEC mide la pobreza en 31 ciudades grandes, no por provincia. ${place.name}: ${cities}.`;
}

const MEASURE_NOTE =
  "Un hogar es pobre si sus ingresos no alcanzan para cubrir la canasta básica total, e indigente si no alcanzan ni para la de alimentos.";

async function Evolucion({ place }: { place: Place }) {
  const data = await getPobreza(place);
  if (!data) return <Unavailable what="el dato de pobreza" />;

  const { lastPersonas, lastHogares, previousYear, personas, indigencia, cities, meta } = data;
  const semester = formatPeriod(lastPersonas.period, "semestre");

  if (cities.length > 0) {
    const [first, ...others] = cities;
    const tableSeries: ChartSeries[] = [
      ...cities.map(({ label, points }, index) => ({ key: `c${index}`, label, color: "", points })),
      { key: "total", label: "Promedio de las 31 ciudades", color: "", points: personas },
    ];
    return (
      <Block>
        <Answer value={formatPercent(first.last.value)}>
          de las personas está bajo la línea de pobreza en {first.label}.
        </Answer>
        <Facts
          items={[
            ...others.map((city) => ({ value: formatPercent(city.last.value), label: `en ${city.label}` })),
            { value: formatPercent(lastPersonas.value), label: "promedio de las 31 ciudades" },
          ]}
        />
        <div className="mt-8">
          <CityChart cities={cities.map(({ label, points }) => ({ label, points }))} total={personas} />
        </div>
        <DataNote
          meta={{ ...meta, coverage: cities.map((city) => city.label).join(", ") }}
          source="Encuesta Permanente de Hogares"
          table={seriesTable(tableSeries, "semestre", "percent")}
        >
          <p>{MEASURE_NOTE}</p>
          <p>
            Dato del {semester}. Es una encuesta: en las ciudades chicas el margen de error es amplio, y por eso las subas y
            bajas de un semestre a otro pueden no ser reales. No incluye a la población rural ni a las ciudades más chicas.
          </p>
        </DataNote>
      </Block>
    );
  }

  const series: ChartSeries[] = [
    { key: "pobreza", label: "Pobreza", color: "var(--series-1)", points: personas },
    ...(indigencia?.status === "ok"
      ? [{ key: "indigencia", label: "Indigencia", color: "var(--series-2)", points: indigencia.points }]
      : []),
  ];
  const lastIndigencia = indigencia?.status === "ok" ? indigencia.points.at(-1) : undefined;

  return (
    <Block>
      <Answer value={formatPercent(lastPersonas.value)}>
        de las personas está bajo la línea de pobreza en las ciudades que releva el INDEC.
      </Answer>
      <Facts
        items={[
          { value: formatPercent(lastHogares.value), label: "de los hogares" },
          ...(lastIndigencia ? [{ value: formatPercent(lastIndigencia.value), label: "de las personas, en la indigencia" }] : []),
          ...(previousYear !== null ? [{ value: formatPercent(previousYear), label: "un año antes" }] : []),
        ]}
      />
      <div className="mt-8">
        <p className="mb-4 text-[15px] font-medium">Personas, por semestre</p>
        <TimeSeriesChart
          series={series}
          frequency="semestre"
          format="percent"
          yDomain={[0, "auto"]}
          height={280}
          summary={`Personas bajo la línea de pobreza desde 2016. Último dato: ${formatPercent(lastPersonas.value)}, ${semester}.`}
        />
      </div>
      <DataNote meta={meta} source="Encuesta Permanente de Hogares" table={seriesTable(series, "semestre", "percent")}>
        <p>{MEASURE_NOTE}</p>
        <p>
          Dato del {semester}. Conviene comparar un semestre con el mismo semestre del año anterior. No incluye a la población
          rural ni a las ciudades más chicas.
        </p>
      </DataNote>
    </Block>
  );
}

async function Calculadora({ place }: { place: Place }) {
  const data = await getLineas(place);
  if (!data) return <Unavailable what="la calculadora" />;

  return (
    <Block title="¿Cuánto necesita tu hogar?">
      <HouseholdCalculator cbt={data.cbt} cba={data.cba} period={data.period} regionName={data.regionName} />
      <DataNote meta={data.meta} source="canastas básicas y Metodología N.° 22">
        <p>
          El INDEC traduce a cada persona en «adultos equivalentes» según sus necesidades por edad y sexo, y multiplica ese
          total por la canasta de un adulto. Es una referencia de la metodología oficial, no un diagnóstico de ningún hogar. Lo
          que elijas no se guarda ni se envía: el cálculo ocurre en tu navegador.
        </p>
        {!place.region ? <p>No hay una canasta nacional: se usa la de Gran Buenos Aires, la referencia que el INDEC publica cada mes.</p> : null}
      </DataNote>
    </Block>
  );
}

async function Ciudades({ place }: { place: Place }) {
  const [data, pobreza] = await Promise.all([getCiudades(), getPobreza(place)]);
  if (!data) return <Unavailable what="la comparación entre ciudades" />;

  const own = place.cities.map((city) => CITIES[city]);
  const list = (
    <BarList
      rows={data.rows.map(({ label, value }) => ({
        label,
        value,
        display: formatPercent(value),
        muted: own.length > 0 && !own.includes(label),
      }))}
      visible={own.length > 0 ? data.rows.length : 5}
      moreLabel={`Ver las ${data.rows.length} ciudades`}
      reference={pobreza?.lastPersonas.value}
      referenceLabel={pobreza ? `Promedio de las 31 ciudades: ${formatPercent(pobreza.lastPersonas.value)}` : undefined}
    />
  );

  return (
    <Block title={own.length > 0 ? undefined : "¿Cómo está cada ciudad?"}>
      {own.length > 0 ? (
        <details>
          <summary className="w-fit text-sm text-link hover:underline">Comparar con las demás ciudades</summary>
          <div className="mt-4">{list}</div>
        </details>
      ) : (
        list
      )}
      {pobreza ? (
        <DataNote meta={{ ...pobreza.meta, lastPeriod: data.period }} source="Encuesta Permanente de Hogares">
          <p>
            Gran Buenos Aires figura separado en la Ciudad y el conurbano, por eso hay 32 filas. Con muestras chicas, dos valores
            cercanos pueden no ser realmente distintos. No usamos un mapa porque una ciudad no representa a toda su provincia.
          </p>
        </DataNote>
      ) : null}
    </Block>
  );
}

async function Content({ params }: { params: Promise<{ lugar: string }> }) {
  const place = await placeFromParams(params);

  return (
    <>
      <PageTitle title="Pobreza" place={place.name} note={titleNote(place)} />
      <Guarded what="el dato de pobreza" height={520}>
        <Evolucion place={place} />
      </Guarded>
      <Guarded what="la calculadora" height={260}>
        <Calculadora place={place} />
      </Guarded>
      <Guarded what="la comparación entre ciudades" height={260}>
        <Ciudades place={place} />
      </Guarded>
    </>
  );
}

export default function PobrezaPage({ params }: PageProps<"/[lugar]/pobreza">) {
  return (
    <PageShell>
      <Suspense fallback={<BlockSkeleton height={560} />}>
        <Content params={params} />
      </Suspense>
    </PageShell>
  );
}
