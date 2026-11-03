"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface Option {
  value: string;
  label: string;
}

/** Selector corto entre pocas opciones. Siempre hay una activa. */
export function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      spacing={0}
      value={[value]}
      onValueChange={(next) => {
        if (next[0]) onChange(next[0]);
      }}
      className="rounded-md border border-rule-strong"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-8 rounded-none px-3 text-sm text-ink-2 first:rounded-l-md last:rounded-r-md hover:bg-surface-2 data-[pressed]:bg-surface-2 data-[pressed]:font-medium data-[pressed]:text-ink"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
