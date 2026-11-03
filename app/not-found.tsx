import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Esta página no existe</h1>
      <p className="mt-3 text-ink-2">
        Puede que el enlace esté mal escrito.{" "}
        <Link href="/" className="text-link hover:underline">
          Volvé al inicio
        </Link>
        .
      </p>
    </div>
  );
}
