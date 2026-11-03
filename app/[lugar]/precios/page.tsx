import type { Metadata } from "next";
import { BarList } from "@/components/charts/bar-list";
import { Suspense } from "react";
import { Answer, Block, BlockSkeleton, Facts, PageShell, PageTitle, Unavailable } from "@/components/editorial/blocks";
import { DataNote } from "@/components/editorial/data-note";
import { Guarded } from "@/components/editorial/guarded";
import { InflationChart } from "@/components/precios/inflation-chart";
import { PriceTable } from "@/components/precios/price-table";
import { placeFromParams, regionInName } from "@/lib/data/place";
import { getPrecios, getProductos, getRubros } from "@/lib/data/precios";
import { getTopicSummary, statDescription } from "@/lib/data/resumen";
import { formatPercent, formatPeriod, formatPesos, formatSignedPercent } from "@/lib/format/es-ar";
import { seriesTable } from "@/lib/format/tables";
import { addMonths } from "@/lib/normalize/periods";
import { REGIONS, regionNote, type Place } from "@/lib/places";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lugar]/precios">): Promise<Metadata> {
  const place = await placeFromParams(params);
  const { precios } = await getTopicSummary(place);
  return pageMetadata({
    title: `Precios · ${place.name}`,
    description: statDescription(precios, `Cuánto suben los precios ${regionInName(place)}, qué aumentó más y cuánto cuestan las cosas de todos los días.`),
    path: `/${place.slug}/precios`,
  });
}

const monthName = (period: string) => formatPeriod(period).split(" de ")[0];

async function Evolucion({ place }: { place: Place }) {
  const data = await getPrecios(place);
  if (!data) return <Unavailable what="cómo vienen los precios" />;

  const { lastMonth, lastYear, accumulated, nationalYear, monthly, meta } = data;
  const verb = lastMonth.value >= 0 ? "subieron" : "bajaron";
  const year = lastMonth.period.slice(0, 4);

  return (
    <Block>
      <Answer value={formatPercent(Math.abs(lastMonth.value))}>
        {verb} los precios {regionInName(place)} en {monthName(lastMonth.period)} respecto de{" "}
        {monthName(addMonths(lastMonth.period, -1))}.
      </Answer>
      <Facts
        items={[
          { value: formatPercent(lastYear.value), label: "en un año" },
          { value: formatPercent(accumulated), label: `en lo que va de ${year}` },
          ...(nationalYear ? [{ value: formatPercent(nationalYear.value), label: "en un año, en todo el país" }] : []),
        ]}
      />
      <div className="mt-8">
        <InflationChart monthly={monthly} />
      </div>
      <DataNote
        meta={meta}
        source="Índice de Precios al Consumidor"
        table={seriesTable([{ key: "m", label: "Aumento mensual", color: "", points: monthly }], "mes", "percent")}
      >
        <p>
          El Índice de Precios al Consumidor (IPC) mide cuánto cambia el costo de una canasta promedio de bienes y
          servicios. Que la inflación baje no significa que los precios bajen: significa que suben más lento.
        </p>
        <p>
          {place.region
            ? `La región ${REGIONS[place.region].name} incluye ${REGIONS[place.region].members}. Los precios se relevan en sus ciudades más grandes.`
            : "Se calcula a partir de los precios de las seis regiones del país."}{" "}
          La canasta del IPC sigue basada en la encuesta de gastos de 2004/05: su actualización se postergó en febrero de
          2026.
        </p>
      </DataNote>
    </Block>
  );
}

async function Rubros({ place }: { place: Place }) {
  const data = await getRubros(place);
  if (!data) return <Unavailable what="qué rubros subieron más" />;

  return (
    <Block title="¿Qué subió más en el último año?">
      <BarList
        rows={data.rows.map(({ label, value }) => ({
          label,
          value,
          display: formatPercent(value),
          muted: value < data.average,
        }))}
        visible={6}
        moreLabel={`Ver los ${data.rows.length} rubros`}
        reference={data.average}
        referenceLabel={`Promedio de todos los precios: ${formatPercent(data.average)}`}
      />
      <DataNote meta={data.meta} source="Índice de Precios al Consumidor">
        <p>
          Cada barra compara el precio de ese rubro con el del mismo mes del año anterior. Las barras en color subieron más
          que el promedio; las grises, menos.
        </p>
      </DataNote>
    </Block>
  );
}

async function Productos({ place }: { place: Place }) {
  const data = await getProductos(place);
  if (!data) return <Unavailable what="los precios de los productos" />;

  const productCell = (label: string, unit: string) => (
    <>
      {label} <span className="text-ink-3">{unit}</span>
    </>
  );

  if (data.kind === "pais") {
    return (
      <Block title="¿Cuánto cuesta?">
        <p className="mb-4 max-w-2xl text-[15px] text-ink-2">
          No hay un precio nacional: cada región tiene el suyo. Elegí tu provincia para ver los de tu región.
        </p>
        <PriceTable
          columns={["Producto", "Región más barata", "Región más cara"]}
          visible={6}
          moreLabel={`Ver los ${data.rows.length} productos`}
          rows={data.rows.map((row) => ({
            key: row.label,
            cells: [
              productCell(row.label, row.unit),
              <>
                {formatPesos(row.lowest.price)} <span className="block text-[13px] text-ink-3">{row.lowest.region}</span>
              </>,
              <>
                {formatPesos(row.highest.price)} <span className="block text-[13px] text-ink-3">{row.highest.region}</span>
              </>,
            ],
          }))}
        />
        <DataNote meta={data.meta} source="precios promedio de una selección de productos">
          <p>Son precios promedio: no igualan marca ni calidad entre regiones, y sirven como referencia.</p>
        </DataNote>
      </Block>
    );
  }

  return (
    <Block title="¿Cuánto cuesta?">
      <PriceTable
        columns={["Producto", "Precio", "En un año"]}
        visible={6}
        moreLabel={`Ver los ${data.rows.length} productos`}
        rows={data.rows.map((row) => ({
          key: row.label,
          cells: [
            productCell(row.label, row.unit),
            <span key="p" className="font-medium">{formatPesos(row.price)}</span>,
            row.yearChange !== null ? formatSignedPercent(row.yearChange, 0) : "sin dato",
          ],
        }))}
      />
      <DataNote meta={data.meta} source="precios promedio de una selección de productos">
        <p>
          Son precios promedio: no igualan marca ni calidad, y sirven como referencia. Frutas y verduras cambian mucho según
          la estación. El INDEC publica 14 productos por región y más variedad para Gran Buenos Aires.
        </p>
      </DataNote>
    </Block>
  );
}

async function Content({ params }: { params: Promise<{ lugar: string }> }) {
  const place = await placeFromParams(params);

  return (
    <>
      <PageTitle title="Precios" place={place.name} note={regionNote(place, "los precios")} />
      <Guarded what="cómo vienen los precios" height={520}>
        <Evolucion place={place} />
      </Guarded>
      <Guarded what="qué rubros subieron más" height={320}>
        <Rubros place={place} />
      </Guarded>
      <Guarded what="los precios de los productos" height={320}>
        <Productos place={place} />
      </Guarded>
    </>
  );
}

export default function PreciosPage({ params }: PageProps<"/[lugar]/precios">) {
  return (
    <PageShell>
      <Suspense fallback={<BlockSkeleton height={560} />}>
        <Content params={params} />
      </Suspense>
    </PageShell>
  );
}
