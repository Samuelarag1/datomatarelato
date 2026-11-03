import type { Metadata } from "next";
import { TopicRedirect } from "@/components/place/topic-redirect";

export const metadata: Metadata = { robots: { index: false } };

export default function Page() {
  return <TopicRedirect segment="/pobreza" label="pobreza" />;
}
