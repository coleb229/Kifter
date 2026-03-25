export type WeightUnit = "kg" | "lb";

/** Convert a stored kg value to the display unit */
export function toDisplay(kg: number, unit: WeightUnit): number {
  if (unit === "lb") return Math.round(kg * 2.20462 * 10) / 10;
  return kg;
}

/** Convert a user-entered value in the given unit back to kg for storage */
export function toKg(value: number, unit: WeightUnit): number {
  if (unit === "lb") return Math.round((value / 2.20462) * 100) / 100;
  return value;
}

/** Convert a weight value from one unit to another, rounded to 1 decimal */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return Math.round(value * 10) / 10;
  if (to === "lb") return Math.round(value * 2.20462 * 10) / 10;
  return Math.round((value / 2.20462) * 10) / 10;
}
