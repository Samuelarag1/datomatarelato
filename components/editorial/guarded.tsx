import { Suspense, type ReactNode } from "react";
import { BlockSkeleton } from "./blocks";
import { SectionBoundary } from "./section-boundary";

/** Aísla cada bloque: si una fuente falla o tarda, el resto de la página sigue disponible. */
export function Guarded({ what, height, children }: { what: string; height?: number; children: ReactNode }) {
  return (
    <SectionBoundary what={what}>
      <Suspense fallback={<BlockSkeleton height={height} />}>{children}</Suspense>
    </SectionBoundary>
  );
}
