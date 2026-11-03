import { placeImage, SHARE_SIZE, SHARE_TYPE } from "@/components/og/share-image";
import { placeFromParams, placeStaticParams } from "@/lib/data/place";
import { getTopicSummary } from "@/lib/data/resumen";

export const alt = "Último dato de precios, ingresos y pobreza del lugar, con su fuente";
export const size = SHARE_SIZE;
export const contentType = SHARE_TYPE;
export const generateStaticParams = placeStaticParams;

export default async function Image({ params }: { params: Promise<{ lugar: string }> }) {
  const place = await placeFromParams(params);
  return placeImage(place, await getTopicSummary(place));
}
