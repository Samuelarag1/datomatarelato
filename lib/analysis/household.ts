// Tabla de equivalencias de necesidades energéticas: INDEC, Metodología N.° 22, página 21.
// Cada persona equivale a una fracción de un "adulto equivalente" (varón de 30 a 45 años).

export type Sex = "mujer" | "varon";

export interface AgeGroup {
  id: string;
  label: string;
  /** Coeficiente único cuando la tabla no distingue sexo. */
  both?: number;
  mujer?: number;
  varon?: number;
}

export const AGE_GROUPS: AgeGroup[] = [
  { id: "m6", label: "6 a 9 meses", both: 0.28 },
  { id: "m9", label: "9 a 12 meses", both: 0.35 },
  { id: "1", label: "1 año", both: 0.37 },
  { id: "2", label: "2 años", both: 0.46 },
  { id: "3", label: "3 años", both: 0.51 },
  { id: "4", label: "4 años", both: 0.55 },
  { id: "5", label: "5 años", both: 0.6 },
  { id: "6", label: "6 años", both: 0.64 },
  { id: "7", label: "7 años", both: 0.66 },
  { id: "8", label: "8 años", both: 0.68 },
  { id: "9", label: "9 años", both: 0.69 },
  { id: "10", label: "10 años", varon: 0.79, mujer: 0.7 },
  { id: "11", label: "11 años", varon: 0.82, mujer: 0.72 },
  { id: "12", label: "12 años", varon: 0.85, mujer: 0.74 },
  { id: "13", label: "13 años", varon: 0.9, mujer: 0.76 },
  { id: "14", label: "14 años", varon: 0.96, mujer: 0.76 },
  { id: "15", label: "15 años", varon: 1.0, mujer: 0.77 },
  { id: "16", label: "16 años", varon: 1.03, mujer: 0.77 },
  { id: "17", label: "17 años", varon: 1.04, mujer: 0.77 },
  { id: "18-29", label: "18 a 29 años", varon: 1.02, mujer: 0.76 },
  { id: "30-45", label: "30 a 45 años", varon: 1.0, mujer: 0.77 },
  { id: "46-60", label: "46 a 60 años", varon: 1.0, mujer: 0.76 },
  { id: "61-75", label: "61 a 75 años", varon: 0.83, mujer: 0.67 },
  { id: "75+", label: "Más de 75 años", varon: 0.74, mujer: 0.63 },
];

export interface HouseholdMember {
  ageGroupId: string;
  sex: Sex;
}

/** Hogar de referencia del INDEC: varón de 35, mujer de 31, hijo de 6 e hija de 8 años. */
export const REFERENCE_HOUSEHOLD: HouseholdMember[] = [
  { ageGroupId: "30-45", sex: "varon" },
  { ageGroupId: "30-45", sex: "mujer" },
  { ageGroupId: "6", sex: "varon" },
  { ageGroupId: "8", sex: "mujer" },
];

export function needsSex(ageGroupId: string): boolean {
  return AGE_GROUPS.find((group) => group.id === ageGroupId)?.both === undefined;
}

export function coefficient({ ageGroupId, sex }: HouseholdMember): number {
  const group = AGE_GROUPS.find((candidate) => candidate.id === ageGroupId);
  if (!group) return 0;
  return group.both ?? group[sex] ?? 0;
}

export function adultEquivalents(members: HouseholdMember[]): number {
  // Se redondea para evitar arrastrar errores de punto flotante al sumar coeficientes.
  return Math.round(members.reduce((sum, member) => sum + coefficient(member), 0) * 100) / 100;
}
