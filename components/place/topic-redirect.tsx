"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { COUNTRY } from "@/lib/places";
import { readSavedPlace } from "./use-place";

/** Una dirección sin lugar, como /precios, lleva al tema en el lugar elegido. */
export function TopicRedirect({ segment, label }: { segment: string; label: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${(readSavedPlace() ?? COUNTRY).slug}${segment}`);
  }, [router, segment]);

  return (
    <p className="mx-auto max-w-5xl px-4 py-16 text-ink-2 sm:px-6">
      <Link href={`/${COUNTRY.slug}${segment}`} className="text-link hover:underline">
        Ver {label}
      </Link>
    </p>
  );
}
