import { SHARE_SIZE, SHARE_TYPE, topicImage } from "@/components/og/share-image";
import { placeFromParams, placeStaticParams, regionInName } from "@/lib/data/place";
import { getTopicSummary } from "@/lib/data/resumen";

export const alt = "Cuánto de la canasta básica cubre el salario mínimo, con su cobertura, su período y su fuente";
export const size = SHARE_SIZE;
export const contentType = SHARE_TYPE;
export const generateStaticParams = placeStaticParams;

export default async function Image({ params }: { params: Promise<{ lugar: string }> }) {
  const place = await placeFromParams(params);
  const { alcanza } = await getTopicSummary(place);
  return topicImage("¿Alcanza?", place, alcanza, `Cuánto de la canasta básica cubre el salario mínimo ${regionInName(place)}.`);
}
