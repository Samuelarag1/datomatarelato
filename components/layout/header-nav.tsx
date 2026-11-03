"use client";

import { LocateFixed, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCATION_MESSAGES, useGeolocation, usePlace } from "@/components/place/use-place";
import { cn } from "@/lib/utils";
import { COUNTRY, PLACES } from "@/lib/places";

const TOPICS = [
  { segment: "", label: "Resumen" },
  { segment: "/precios", label: "Precios" },
  { segment: "/alcanza", label: "¿Alcanza?" },
  { segment: "/pobreza", label: "Pobreza" },
];

const OPTIONS = PLACES.map(({ slug, name }) => ({ value: slug, label: name }));

export function HeaderNav() {
  const pathname = usePathname();
  const { current, choose } = usePlace();
  const { status, locate, supported } = useGeolocation(choose);
  const slug = (current ?? COUNTRY).slug;

  // En pantallas angostas: logo y lugar arriba, y el menú en su propio renglón.
  return (
    <>
      <nav aria-label="Temas" className="order-last w-full md:order-none md:w-auto">
        <ul className="flex items-center gap-x-4 text-sm">
          {TOPICS.map(({ segment, label }) => {
            const href = `/${slug}${segment}`;
            const active = pathname === href;
            return (
              <li key={label}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn("inline-block py-1 text-ink-2 hover:text-ink", active && "font-medium text-ink")}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 md:flex-none">
        {supported ? (
          <button
            type="button"
            onClick={locate}
            disabled={status === "locating"}
            aria-label="Usar mi ubicación"
            title="Usar mi ubicación"
            className="grid size-9 place-items-center rounded-md border border-rule-strong text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-60"
          >
            <LocateFixed className="size-4" aria-hidden="true" />
          </button>
        ) : null}
        <Select items={OPTIONS} value={current?.slug ?? null} onValueChange={(next) => next && choose(next)}>
          <SelectTrigger aria-label="Elegí tu provincia" className="h-9 w-full min-w-0 rounded-md bg-surface text-sm sm:w-52">
            <MapPin className="hidden size-4 text-ink-3 sm:block" aria-hidden="true" />
            <SelectValue placeholder="Elegí tu provincia" className="block min-w-0 truncate" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="end" className="max-h-80">
            {OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {LOCATION_MESSAGES[status] ? (
        <p role="status" className="order-last w-full text-sm text-ink-2">
          {LOCATION_MESSAGES[status]}
        </p>
      ) : null}
    </>
  );
}
