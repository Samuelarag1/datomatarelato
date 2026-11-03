import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>;
}

export function PageTitle({ title, place, note }: { title: string; place?: string; note?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
        {place ? <span className="font-normal text-ink-3"> · {place}</span> : null}
      </h1>
      {note ? <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-3">{note}</p> : null}
    </header>
  );
}

export function Block({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mt-12 first:mt-0">
      {title ? <h2 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2> : null}
      {children}
    </section>
  );
}

/** La respuesta de la sección: un número y qué significa, en una frase. */
export function Answer({ value, children }: { value: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-5xl font-semibold tracking-tight sm:text-6xl">{value}</p>
      <p className="mt-2 max-w-xl text-lg leading-snug text-ink-2">{children}</p>
    </div>
  );
}

/** Datos de apoyo a la respuesta, en tamaño menor. */
export function Facts({ items }: { items: { value: string; label: string }[] }) {
  return (
    <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-3">
      {items.map(({ value, label }) => (
        <div key={label}>
          <dd className="text-xl font-semibold tracking-tight">{value}</dd>
          <dt className="text-sm text-ink-3">{label}</dt>
        </div>
      ))}
    </dl>
  );
}

export function Unavailable({ what }: { what: string }) {
  return (
    <p className="rounded-md bg-surface-2 p-4 text-[15px] text-ink-2">
      Ahora no podemos mostrar {what}: la fuente oficial no respondió o sus datos no pasaron nuestros controles. Probá de
      nuevo en unos minutos.
    </p>
  );
}

export function BlockSkeleton({ height = 240 }: { height?: number }) {
  return <div aria-hidden="true" className="mt-12 animate-pulse rounded-md bg-surface-2 first:mt-0" style={{ height }} />;
}
