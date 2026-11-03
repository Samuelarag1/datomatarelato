import type { ReactNode } from "react";
import { DataTable } from "@/components/charts/data-table";
import type { SourceMeta } from "@/lib/data/load";
import { formatDate, formatPeriod } from "@/lib/format/es-ar";

/**
 * De dónde sale el dato, en un renglón. Al abrirlo aparece el detalle: siempre disponible,
 * nunca en el camino de quien solo quiere la respuesta.
 */
export function DataNote({
  meta,
  source,
  table,
  children,
}: {
  meta: SourceMeta;
  source?: string;
  table?: { columns: string[]; rows: string[][] };
  children?: ReactNode;
}) {
  return (
    <details className="mt-4 text-[13px] leading-relaxed text-ink-3">
      {/* Se avisa en el mismo renglón: si la fuente falló, tiene que verse sin abrir nada. */}
      <summary className="list-none [&::-webkit-details-marker]:hidden">
        {meta.stale ? <strong className="mr-1 font-medium text-ink-2">Último dato válido: la fuente no respondió.</strong> : null}
        Fuente: {meta.publisher} · {meta.coverage} · {formatPeriod(meta.lastPeriod, meta.frequency)} ·{" "}
        <span className="text-link hover:underline">Más sobre este dato</span>
      </summary>
      <div className="mt-2 max-w-2xl space-y-2 text-sm text-ink-2">
        {source ? <p>Fuente: {meta.publisher}, {source}.</p> : null}
        {children}
        {table ? <DataTable columns={table.columns} rows={table.rows} /> : null}
        <p className="text-[13px] text-ink-3">Consultado el {formatDate(meta.fetchedAt)}.</p>
      </div>
    </details>
  );
}
