import Link from "next/link";
import { SITE } from "@/lib/site";
import { HeaderNav } from "./header-nav";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6 md:gap-x-6">
        <Link href="/" aria-label={`${SITE.name}, ir al inicio`} className="rounded-sm">
          <Logo />
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
