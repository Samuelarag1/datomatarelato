import { SHARE_SIZE, SHARE_TYPE, topicImage } from "@/components/og/share-image";
import { placeFromParams, placeStaticParams } from "@/lib/data/place";
import { getTopicSummary } from "@/lib/data/resumen";

export const alt = "Último dato de pobreza del lugar, con su cobertura, su período y su fuente";
export const size = SHARE_SIZE;
export const contentType = SHARE_TYPE;
export const generateStaticParams = placeStaticParams;

export default async function Image({ params }: { params: Promise<{ lugar: string }> }) {
  const place = await placeFromParams(params);
  const { pobreza } = await getTopicSummary(place);
  return topicImage("Pobreza", place, pobreza, `Cuánta gente está bajo la línea de pobreza ${place.inName}.`);
}
