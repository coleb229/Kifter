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
