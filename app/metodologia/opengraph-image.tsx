import { SHARE_SIZE, SHARE_TYPE, textImage } from "@/components/og/share-image";

export const alt = "Cómo trabajamos: de dónde salen los datos y cómo los controlamos";
export const size = SHARE_SIZE;
export const contentType = SHARE_TYPE;

export default function Image() {
  return textImage("Cómo trabajamos", "De dónde salen los datos, cómo los controlamos y qué decidimos no hacer.");
}
