"use client";

import { LocateFixed } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLACES, placeLabel } from "@/lib/places";
import { LOCATION_MESSAGES, useGeolocation, usePlace } from "./use-place";

const OPTIONS = PLACES.map(({ slug, name }) => ({ value: slug, label: name }));

/** Selector principal del inicio: ubicación opcional y lista manual siempre disponible. */
export function PlacePicker() {
  const { saved, choose } = usePlace();
  const { status, locate, supported } = useGeolocation(choose);
  const message = LOCATION_MESSAGES[status];

  return (
    <div className="rounded-lg border border-rule p-5 sm:p-6">
      <h2 className="text-lg font-semibold">¿Desde dónde mirás?</h2>
      <p className="mt-1 text-sm text-ink-2">Te mostramos el dato más cercano a tu lugar.</p>

      {supported ? (
        <>
          <button
            type="button"
            onClick={locate}
            disabled={status === "locating"}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            <LocateFixed className="size-4" aria-hidden="true" />
            Usar mi ubicación
          </button>
          <p className="my-3 text-center text-sm text-ink-3">o elegí de la lista</p>
        </>
      ) : (
        <div className="h-4" />
      )}

      <Select items={OPTIONS} value={saved?.slug ?? null} onValueChange={(next) => next && choose(next)}>
        <SelectTrigger aria-label="Elegí tu provincia" className="h-10 w-full rounded-md bg-surface text-sm">
          <SelectValue placeholder="Elegí tu provincia" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start" className="max-h-80">
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {message ? (
        <p role="status" className="mt-3 text-sm text-ink-2">
          {message}
        </p>
      ) : null}

      {saved ? (
        <p className="mt-4 border-t border-rule pt-3 text-sm">
          <Link href={`/${saved.slug}`} className="font-medium text-link hover:underline">
            Seguir con {placeLabel(saved)}
          </Link>
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-ink-3">
        Tu ubicación se usa una sola vez para saber en qué provincia estás. No la guardamos ni la vemos: la consulta va
        directo al servicio oficial Georef.
      </p>
    </div>
  );
}
