"use client";

import { useState } from "react";
import {
  adultEquivalents,
  AGE_GROUPS,
  needsSex,
  REFERENCE_HOUSEHOLD,
  type HouseholdMember,
  type Sex,
} from "@/lib/analysis/household";
import { formatPeriod, formatPesos } from "@/lib/format/es-ar";

const adult = (sex: Sex): HouseholdMember => ({ ageGroupId: "30-45", sex });
const child = (ageGroupId: string): HouseholdMember => ({ ageGroupId, sex: "mujer" });

const PRESETS: { id: string; label: string; members: HouseholdMember[] }[] = [
  { id: "pareja-2", label: "Pareja con 2 hijos", members: REFERENCE_HOUSEHOLD },
  { id: "pareja-1", label: "Pareja con 1 hijo", members: [adult("varon"), adult("mujer"), child("6")] },
  { id: "madre-2", label: "Madre con 2 hijos", members: [adult("mujer"), child("6"), child("8")] },
  { id: "pareja", label: "Pareja sin hijos", members: [adult("varon"), adult("mujer")] },
  { id: "mujer", label: "Mujer sola", members: [adult("mujer")] },
  { id: "varon", label: "Varón solo", members: [adult("varon")] },
  {
    id: "jubilados",
    label: "Pareja de jubilados",
    members: [{ ageGroupId: "61-75", sex: "varon" }, { ageGroupId: "61-75", sex: "mujer" }],
  },
];

const selectClass = "h-9 rounded-md border border-rule-strong bg-surface px-2 text-sm";

export function HouseholdCalculator({
  cbt,
  cba,
  period,
  regionName,
}: {
  cbt: number;
  cba: number;
  period: string;
  regionName: string;
}) {
  const [preset, setPreset] = useState<string | null>(PRESETS[0].id);
  const [members, setMembers] = useState<HouseholdMember[]>(PRESETS[0].members);
  const equivalents = adultEquivalents(members);

  function choosePreset(id: string) {
    const next = PRESETS.find((candidate) => candidate.id === id);
    if (!next) return;
    setPreset(id);
    setMembers(next.members);
  }

  function edit(next: HouseholdMember[]) {
    setPreset(null);
    setMembers(next);
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de hogar">
          {PRESETS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={preset === id}
              onClick={() => choosePreset(id)}
              className={`h-9 rounded-md border px-3 text-sm ${
                preset === id ? "border-ink bg-surface-2 font-medium" : "border-rule-strong text-ink-2 hover:bg-surface-2"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <details className="mt-4">
          <summary className="w-fit text-sm text-link hover:underline">Armar mi hogar persona por persona</summary>
          <ul className="mt-3 space-y-2">
            {members.map((member, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Edad de la persona ${index + 1}`}
                  className={selectClass}
                  value={member.ageGroupId}
                  onChange={(event) =>
                    edit(members.map((item, position) => (position === index ? { ...item, ageGroupId: event.target.value } : item)))
                  }
                >
                  {AGE_GROUPS.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
                {needsSex(member.ageGroupId) ? (
                  <select
                    aria-label={`Sexo de la persona ${index + 1}`}
                    className={selectClass}
                    value={member.sex}
                    onChange={(event) =>
                      edit(members.map((item, position) => (position === index ? { ...item, sex: event.target.value as Sex } : item)))
                    }
                  >
                    <option value="mujer">Mujer</option>
                    <option value="varon">Varón</option>
                  </select>
                ) : null}
                {members.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => edit(members.filter((_, position) => position !== index))}
                    className="text-sm text-ink-3 hover:text-ink hover:underline"
                  >
                    Quitar
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => edit([...members, adult("mujer")])} className="mt-3 text-sm text-link hover:underline">
            Agregar persona
          </button>
        </details>
      </div>

      <div className="rounded-lg bg-surface-2 p-5" aria-live="polite">
        <p className="text-3xl font-semibold tracking-tight">{formatPesos(cbt * equivalents)}</p>
        <p className="mt-1 text-[15px] leading-snug text-ink-2">
          por mes necesita este hogar para no estar bajo la línea de pobreza.
        </p>
        <p className="mt-3 border-t border-rule-strong pt-3 text-sm text-ink-2">
          Solo para comer: <span className="font-medium text-ink">{formatPesos(cba * equivalents)}</span>
        </p>
        <p className="mt-2 text-[13px] text-ink-3">
          Región {regionName}, {formatPeriod(period)}.
        </p>
      </div>
    </div>
  );
}
