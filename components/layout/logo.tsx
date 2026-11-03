import { SITE } from "@/lib/site";

export function Logo() {
  return (
    <span className="block max-w-20 text-[15px] font-semibold leading-[1.15] tracking-tight text-ink sm:max-w-none sm:text-lg">
      {SITE.name}
    </span>
  );
}
