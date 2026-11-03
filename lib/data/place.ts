import "server-only";
import { notFound } from "next/navigation";
import { getPlace, PLACES, REGIONS, type Place } from "../places";

export function placeStaticParams() {
  return PLACES.map(({ slug }) => ({ lugar: slug }));
}

export async function placeFromParams(params: Promise<{ lugar: string }>): Promise<Place> {
  const { lugar } = await params;
  const place = getPlace(lugar);
  if (!place) notFound();
  return place;
}

/** "en el Noroeste" o "en todo el país": dónde se mide lo que depende de la región. */
export const regionInName = (place: Place) => (place.region ? REGIONS[place.region].inName : "en todo el país");
