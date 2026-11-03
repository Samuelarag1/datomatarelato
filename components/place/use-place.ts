"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getPlace, placeFromLocation, type Place } from "@/lib/places";

const STORAGE_KEY = "lugar-elegido";
const CHANGE_EVENT = "lugar-elegido-cambio";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readSaved(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export const readSavedPlace = () => getPlace(readSaved());

function remember(slug: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, slug);
  } catch {
    // Sin almacenamiento disponible, la selección sigue funcionando por la URL.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Hay un solo lugar elegido: el último que se eligió o se abrió con un enlace. La URL manda, así
 * los enlaces se pueden compartir, y el inicio y el menú lo siguen. No se guarda la ubicación.
 */
export function usePlace() {
  const pathname = usePathname();
  const router = useRouter();
  const saved = getPlace(useSyncExternalStore(subscribe, readSaved, () => null));
  const firstSegment = pathname.split("/")[1];
  const fromUrl = getPlace(firstSegment);

  useEffect(() => {
    if (fromUrl && fromUrl !== saved) remember(fromUrl.slug);
  }, [fromUrl, saved]);

  const choose = useCallback(
    (slug: string) => {
      remember(slug);
      router.push(fromUrl ? pathname.replace(`/${firstSegment}`, `/${slug}`) : `/${slug}`);
    },
    [firstSegment, fromUrl, pathname, router],
  );

  return { current: fromUrl ?? saved ?? null, saved: saved ?? null, choose };
}

export type LocationStatus = "idle" | "locating" | "denied" | "outside" | "error";

export const LOCATION_MESSAGES: Record<LocationStatus, string | null> = {
  idle: null,
  locating: "Buscando tu ubicación…",
  denied: "No tenemos permiso para usar tu ubicación. Elegí tu provincia de la lista.",
  outside: "No encontramos esa ubicación dentro de Argentina. Elegí tu provincia de la lista.",
  error: "No pudimos obtener tu ubicación. Elegí tu provincia de la lista.",
};

const GEOREF_URL = "https://apis.datos.gob.ar/georef/api/ubicacion";

async function resolvePlace(latitude: number, longitude: number): Promise<Place | undefined> {
  // Dos decimales alcanzan para saber el partido o la provincia, sin enviar la posición exacta.
  const query = new URLSearchParams({
    lat: latitude.toFixed(2),
    lon: longitude.toFixed(2),
    campos: "provincia.id,departamento.id",
  });
  const response = await fetch(`${GEOREF_URL}?${query}`);
  if (!response.ok) throw new Error(`Georef respondió ${response.status}`);
  const { ubicacion } = await response.json();
  return placeFromLocation(ubicacion?.provincia?.id ?? null, ubicacion?.departamento?.id ?? null);
}

const noSubscribe = () => () => {};

/** Pide la ubicación solo cuando la persona lo decide: nunca al cargar la página. */
export function useGeolocation(onFound: (slug: string) => void) {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const supported = useSyncExternalStore(noSubscribe, () => "geolocation" in navigator, () => false);

  const locate = useCallback(() => {
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const place = await resolvePlace(coords.latitude, coords.longitude);
          if (!place) {
            setStatus("outside");
            return;
          }
          setStatus("idle");
          onFound(place.slug);
        } catch {
          setStatus("error");
        }
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error"),
      { timeout: 10_000, maximumAge: 3_600_000, enableHighAccuracy: false },
    );
  }, [onFound]);

  return { status, locate, supported };
}
