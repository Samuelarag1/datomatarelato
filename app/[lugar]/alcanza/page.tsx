import type { Metadata } from "next";
import { BarList } from "@/components/charts/bar-list";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Suspense } from "react";
import { Answer, Block, BlockSkeleton, PageShell, PageTitle, Unavailable } from "@/components/editorial/blocks";
import { DataNote } from "@/components/editorial/data-note";
import { Guarded } from "@/components/editorial/guarded";
import { getCobertura, getCrianza, getSalarios } from "@/lib/data/ingresos";
import { placeFromParams, regionInName } from "@/lib/data/place";
import { formatPercent, formatPeriod, formatPesos } from "@/lib/format/es-ar";
import { seriesTable } from "@/lib/format/tables";
import { regionNote, type Place } from "@/lib/places";

export async function generateMetadata({ params }: PageProps<"/[lugar]/alcanza">): Promise<Metadata> {
  const place = await placeFromParams(params);
  return {
    title: `¿Alcanza? · ${place.name}`,
    description: `Cuánto de la canasta básica cubren el salario mínimo y la jubilación mínima ${regionInName(place)}.`,
  };
}

const BASKET_DEFINITION =
  "La canasta básica total es lo que, según el INDEC, una persona adulta necesita por mes para no ser pobre: alimentos, servicios y otros gastos.";

async function Cobertura({ place }: { place: Place }) {
  const data = await getCobertura(place);
  if (!data) return <Unavailable what="cuánto cubren los ingresos" />;

  if (data.kind === "pais") {
    const shares = data.rows.map((row) => row.smvmShare);
    return (
      <Block>
        <Answer value={`${formatPercent(Math.min(...shares), 0)} a ${formatPercent(Math.max(...shares), 0)}`}>
          de la canasta básica de un adulto cubre el salario mínimo, según la región.
        </Answer>
        <p className="mb-6 mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">
          {BASKET_DEFINITION} No hay una canasta nacional: cada región tiene la suya.
        </p>
        <BarList
          rows={data.rows.map((row) => ({
            label: row.region,
            value: row.smvmShare,
            display: formatPercent(row.smvmShare, 0),
            detail: `Canasta: ${formatPesos(row.basket)}`,
          }))}
          reference={100}
          referenceLabel="La canasta completa"
        />
        <DataNote meta={data.meta} source="canastas regionales. Salario mínimo: Secretaría de Trabajo">
          <p>Las canastas regionales se publican junto con el dato de pobreza, dos veces por año.</p>
        </DataNote>
      </Block>
    );
  }

  const series = [
    { key: "smvm", label: "Salario mínimo", color: "var(--series-1)", points: data.history.smvm },
    { key: "haber", label: "Jubilación mínima, sin bono", color: "var(--series-2)", points: data.history.haber },
  ];

  return (
    <Block>
        <Answer value={formatPercent(data.smvmShare, 0)}>
          de la canasta básica de un adulto cubre el salario mínimo {regionInName(place)}.
        </Answer>
        <p className="mb-6 mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">{BASKET_DEFINITION}</p>
        <BarList
          rows={[
            { label: "Canasta básica de un adulto", value: data.basket, display: formatPesos(data.basket) },
            {
              label: "Salario mínimo",
              value: data.minimum,
              display: formatPesos(data.minimum),
              detail: `${formatPercent(data.smvmShare, 0)} de la canasta`,
            },
            {
              label: "Jubilación mínima",
              value: data.pension,
              display: formatPesos(data.pension),
              detail: `${formatPercent(data.haberShare, 0)} de la canasta`,
            },
            ...(data.bono
              ? [{
                  label: "Jubilación mínima con bono",
                  value: data.bono.total,
                  display: formatPesos(data.bono.total),
                  detail: `${formatPercent(data.bono.share, 0)} de la canasta`,
                }]
              : []),
          ]}
          reference={data.basket}
        />
        <details className="mt-4">
          <summary className="w-fit text-sm text-link hover:underline">Ver cómo cambió desde 2016</summary>
          <div className="mt-4">
            <TimeSeriesChart
              series={series}
              frequency="mes"
              format="percent0"
              yDomain={[0, "auto"]}
              referenceLine={{ y: 100, label: "La canasta completa" }}
              height={280}
              summary={`Parte de la canasta básica de un adulto que cubren el salario mínimo y la jubilación mínima. Último dato: ${formatPercent(data.smvmShare, 0)} y ${formatPercent(data.haberShare, 0)}.`}
            />
          </div>
        </details>
        <DataNote
          meta={data.meta}
          source="canasta básica. Salario mínimo: Secretaría de Trabajo. Jubilación mínima: ANSES"
          table={seriesTable(series, "mes", "percent0")}
        >
          <p>
            El salario mínimo es un piso legal: estos datos no dicen cuántas personas lo cobran. La canasta es por región;
            el salario mínimo y la jubilación son iguales en todo el país.
          </p>
          <p>
            La línea vertical marca el valor de la canasta. La serie oficial de la jubilación mínima no incluye el bono
            extraordinario de {data.bono ? formatPesos(data.bono.amount) : "ANSES"}, que se muestra aparte.
          </p>
          <p>En el gráfico, por encima de 100% ese ingreso alcanza para más de una canasta de un adulto; por debajo, no llega a cubrirla.</p>
        </DataNote>
    </Block>
  );
}

const describeReal = (real: number) =>
  real >= 0 ? `Le ganó a los precios por ${formatPercent(real)}` : `Perdió ${formatPercent(Math.abs(real))} frente a los precios`;

async function Salarios() {
  const data = await getSalarios();
  if (!data) return <Unavailable what="la evolución de los sueldos" />;

  const rows = [
    { label: "Privado registrado", values: data.privado },
    { label: "Sector público", values: data.publico },
    { label: "Privado no registrado*", values: data.noRegistrado },
  ].flatMap(({ label, values }) => (values ? [{ label, ...values }] : []));

  const history = [
    { key: "privado", label: "Privado registrado", color: "var(--series-1)", points: data.history.privado },
    { key: "publico", label: "Sector público", color: "var(--series-2)", points: data.history.publico },
  ];

  return (
    <Block title="¿Los sueldos le ganan a los precios?">
      <p className="mb-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">
        En el año a {formatPeriod(data.period)}, los precios subieron{" "}
        <span className="font-medium text-ink">{formatPercent(data.prices)}</span> en todo el país.
      </p>
      <ul className="max-w-3xl divide-y divide-rule border-y border-rule">
        {rows.map(({ label, nominal, real }) => (
          <li key={label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 py-2.5 text-[15px]">
            <span>
              {label} <span className="text-ink-3">subió {formatPercent(nominal)}</span>
            </span>
            <span className="font-medium">{describeReal(real)}</span>
          </li>
        ))}
      </ul>
      <details className="mt-3">
        <summary className="w-fit text-sm text-link hover:underline">Ver cómo evolucionó desde 2016</summary>
        <div className="mt-4">
          <TimeSeriesChart
            series={history}
            frequency="mes"
            format="index"
            referenceLine={{ y: 100, label: "Lo que compraba en diciembre de 2016" }}
            height={280}
            summary="Salario real del sector privado registrado y del sector público, con diciembre de 2016 igual a 100."
          />
        </div>
      </details>
      <DataNote meta={data.meta} source="Índice de Salarios">
        <p>
          *El INDEC estima el salario no registrado con una encuesta y unos cinco meses de rezago, así que refleja ingresos de
          meses anteriores y no se compara directamente con los otros dos.
        </p>
        <p>Son promedios por sector de todo el país: el índice mide cuánto cambian los sueldos, no cuánto gana una persona.</p>
      </DataNote>
    </Block>
  );
}

async function Crianza({ place }: { place: Place }) {
  const data = await getCrianza();
  if (data.status === "sin-token") return null;
  if (data.status !== "ok") return <Unavailable what="cuánto cuesta criar a un hijo" />;

  return (
    <Block title="¿Cuánto cuesta criar a un hijo?">
      {place.region !== "gba" ? (
        <p className="mb-4 max-w-2xl text-[15px] text-ink-2">
          El INDEC la calcula solo para Gran Buenos Aires, así que sirve como referencia.
        </p>
      ) : null}
      <BarList
        rows={data.rows.map(({ label, total }) => ({ label, value: total, display: formatPesos(total) }))}
      />
      <DataNote
        meta={{
          publisher: "INDEC",
          coverage: "Gran Buenos Aires",
          frequency: "mes",
          lastPeriod: data.period,
          fetchedAt: data.fetchedAt,
          stale: data.stale,
        }}
        source="canasta de crianza"
      >
        <p>
          Es el costo mensual por hijo: bienes y servicios más el valor del tiempo de cuidado, aunque nadie lo pague. Por eso no
          se compara directamente con los gastos en efectivo de un hogar.
        </p>
        <ul className="list-disc space-y-0.5 pl-5">
          {data.rows.map(({ label, goods, care }) => (
            <li key={label}>
              {label}: {formatPesos(goods)} en bienes y servicios, y {formatPesos(care)} en cuidado.
            </li>
          ))}
        </ul>
      </DataNote>
    </Block>
  );
}

async function Content({ params }: { params: Promise<{ lugar: string }> }) {
  const place = await placeFromParams(params);

  return (
    <>
      <PageTitle title="¿Alcanza?" place={place.name} note={regionNote(place, "la canasta básica")} />
      <Guarded what="cuánto cubren los ingresos" height={520}>
        <Cobertura place={place} />
      </Guarded>
      <Guarded what="la evolución de los sueldos" height={280}>
        <Salarios />
      </Guarded>
      <Guarded what="cuánto cuesta criar a un hijo" height={260}>
        <Crianza place={place} />
      </Guarded>
    </>
  );
}

export default function AlcanzaPage({ params }: PageProps<"/[lugar]/alcanza">) {
  return (
    <PageShell>
      <Suspense fallback={<BlockSkeleton height={560} />}>
        <Content params={params} />
      </Suspense>
    </PageShell>
  );
}
