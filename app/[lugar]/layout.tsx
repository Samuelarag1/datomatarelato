import { placeStaticParams } from "@/lib/data/place";

// Una página estática por lugar: rápidas, cacheables y con una URL para compartir.
export function generateStaticParams() {
  return placeStaticParams();
}

export default function PlaceLayout({ children }: LayoutProps<"/[lugar]">) {
  return children;
}
