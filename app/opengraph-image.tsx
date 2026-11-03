import { SHARE_SIZE, SHARE_TYPE, siteImage } from "@/components/og/share-image";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}. ${SITE.slogan}`;
export const size = SHARE_SIZE;
export const contentType = SHARE_TYPE;

export default function Image() {
  return siteImage();
}
