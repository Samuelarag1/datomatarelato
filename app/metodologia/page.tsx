import type { Metadata } from "next";
import { Block, PageShell, PageTitle } from "@/components/editorial/blocks";
import { CITIES, PLACES, REGIONS } from "@/lib/places";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cómo trabajamos",
  description: `De dónde salen los datos de ${SITE.name}, cómo los controlamos y qué decidimos no hacer.`,
};

const SOURCES: { what: string; publisher: string; level: string; frequency: string }[] = [
  { what: "Índice de Precios al Consumidor", publisher: "INDEC", level: "País y 6 regiones", frequency: "Mensual" },
  { what: "Precios promedio de productos", publisher: "INDEC", level: "6 regiones", frequency: "Mensual" },
  { what: "Canasta básica", publisher: "INDEC", level: "6 regiones", frequency: "Mensual en GBA; semestral en el resto" },
  { what: "Pobreza e indigencia", publisher: "INDEC", level: "31 ciudades", frequency: "Semestral" },
  { what: "Índice de salarios", publisher: "INDEC", level: "País", frequency: "Mensual" },
  { what: "Salario mínimo", publisher: "Secretaría de Trabajo", level: "País", frequency: "Mensual" },
  { what: "Jubilación mínima", publisher: "ANSES", level: "País", frequency: "Mensual" },
  { what: "Canasta de crianza", publisher: "INDEC", level: "Gran Buenos Aires", frequency: "Mensual" },
  { what: "Población estimada", publisher: "INDEC", level: "Provincia y departamento", frequency: "Anual" },
];

const placesWithData = PLACES.filter((place) => place.region);

export default function MetodologiaPage() {
  return (
    <PageShell>
      <PageTitle
        title="Cómo trabajamos"
        note="No mostramos todos los datos que existen: elegimos los que vale la pena mirar y explicamos de dónde salen."
      />

      <Block title="Nuestras reglas">
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-2">
          <li>No inventamos ni completamos datos. Si falta un valor, se ve el hueco.</li>
          <li>Decimos qué cubre cada número: una región, una ciudad o todo el país no son lo mismo.</li>
          <li>Describimos qué cambió, sin atribuir causas que los datos no prueban.</li>
          <li>Los gráficos no señalan gobiernos, y las fechas de comparación son neutras.</li>
          <li>Si una fuente falla o sus datos no pasan los controles, avisamos y no mostramos un dato dudoso.</li>
        </ul>
      </Block>

      <Block title="De dónde salen los datos">
        <div className="max-w-3xl overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-rule-strong text-[13px] text-ink-3">
                <th scope="col" className="py-1.5 pr-4 font-normal">Dato</th>
                <th scope="col" className="py-1.5 pr-4 font-normal">Publica</th>
                <th scope="col" className="py-1.5 pr-4 font-normal">Nivel</th>
                <th scope="col" className="py-1.5 font-normal">Frecuencia</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map(({ what, publisher, level, frequency }) => (
                <tr key={what} className="border-b border-rule">
                  <td className="py-2 pr-4">{what}</td>
                  <td className="py-2 pr-4 text-ink-2">{publisher}</td>
                  <td className="py-2 pr-4 text-ink-2">{level}</td>
                  <td className="py-2 text-ink-2">{frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>

      <Block title="Qué dato corresponde a cada lugar">
        <p className="mb-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">
          El INDEC no publica estos datos por provincia. Usamos la región para precios y canastas, y las ciudades relevadas por
          la Encuesta Permanente de Hogares para la pobreza.
        </p>
        <details>
          <summary className="w-fit text-sm text-link hover:underline">Ver la tabla de todas las provincias</summary>
          <div className="mt-3 max-w-3xl overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-b border-rule-strong text-[13px] text-ink-3">
                  <th scope="col" className="py-1.5 pr-4 font-normal">Lugar</th>
                  <th scope="col" className="py-1.5 pr-4 font-normal">Región</th>
                  <th scope="col" className="py-1.5 font-normal">Ciudades</th>
                </tr>
              </thead>
              <tbody>
                {placesWithData.map(({ slug, name, region, cities }) => (
                  <tr key={slug} className="border-b border-rule">
                    <td className="py-1.5 pr-4">{name}</td>
                    <td className="py-1.5 pr-4 text-ink-2">{region ? REGIONS[region].name : ""}</td>
                    <td className="py-1.5 text-ink-2">{cities.map((city) => CITIES[city]).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Block>

      <Block title="Cómo controlamos los datos">
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-2">
          Los catálogos públicos tienen errores. Antes de mostrar una serie revisamos que exista la columna esperada y que no
          tenga huecos no previstos, fechas futuras ni saltos imposibles. Además, un control aparte compara las fuentes con
          valores oficiales conocidos. Así encontramos, por ejemplo, series de pobreza con la fecha corrida un semestre y
          precios con etiquetas cruzadas. Por eso elegimos la fuente de cada dato según lo que comprobamos.
        </p>
      </Block>

      <Block title="Tu ubicación">
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-2">
          Si elegís usar tu ubicación, tu navegador consulta directamente al servicio oficial Georef con tu posición aproximada,
          para saber en qué provincia estás. Nosotros no recibimos ni guardamos esa información. Lo único que queda en tu
          navegador es el último lugar que elegiste o abriste, para no volver a preguntarte.
        </p>
      </Block>
    </PageShell>
  );
}
