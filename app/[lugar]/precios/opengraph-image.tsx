import { SHARE_SIZE, SHARE_TYPE, topicImage } from "@/components/og/share-image";
import { placeFromParams, placeStaticParams, regionInName } from "@/lib/data/place";
import { getTopicSummary } from "@/lib/data/resumen";

export const alt = "Último dato de precios del lugar, con su cobertura, su período y su fuente";
export const size = SHARE_SIZE;
export const contentType = SHARE_TYPE;
export const generateStaticParams = placeStaticParams;

export default async function Image({ params }: { params: Promise<{ lugar: string }> }) {
  const place = await placeFromParams(params);
  const { precios } = await getTopicSummary(place);
  return topicImage("Precios", place, precios, `Cuánto suben los precios ${regionInName(place)}.`);
}
