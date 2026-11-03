"use client";

import { catchError, type ErrorInfo } from "next/error";
import { Unavailable } from "./blocks";

function SectionError({ what }: { what: string }, { retry }: ErrorInfo) {
  return (
    <div className="mt-12 first:mt-0">
      <Unavailable what={what} />
      <button type="button" onClick={() => retry()} className="mt-2 text-sm text-link hover:underline">
        Reintentar
      </button>
    </div>
  );
}

/** Contiene el error de un bloque para que el resto de la página siga funcionando. */
export const SectionBoundary = catchError(SectionError);
