/** El nombre es el logo: el dato queda en pie y el relato, tachado. */
export function Logo() {
  return (
    <span className="block max-w-20 text-[15px] font-semibold leading-[1.15] tracking-tight text-ink sm:max-w-none sm:text-lg">
      Dato Mata{" "}
      <span className="font-normal text-ink-3 line-through decoration-link decoration-2">Relato</span>
    </span>
  );
}
