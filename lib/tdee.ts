import type { BodyTarget } from "@/types";

// MET (metabolic equivalent of task) values per body target type
const MET_BY_TARGET: Record<BodyTarget, number> = {
  Push: 6,
  Pull: 6,
  Legs: 6,
  "Upper Body": 6,
  "Lower Body": 6,
  "Full Body": 7,
  Core: 4,
  Cardio: 8,
  Other: 5,
};

// Average session duration (minutes) assumed when not tracked
const DEFAULT_DURATION_MINUTES = 45;

export interface TDEEResult {
  tdee: number;
  bmr: number;
  isBMROnly: boolean;
}

/**
 * Estimates TDEE for a day given today's training sessions.
 *
 * BMR baseline: ~1700 kcal for 70 kg person; scales linearly with bodyWeight.
 * Workout calories: MET × bodyWeightKg × durationHours × 1 (kcal/kg/hour approximation via MET).
 */
export function calculateTDEE(
  sessions: { bodyTarget: BodyTarget; durationMinutes?: number }[],
  bodyWeightKg: number,
): TDEEResult {
  const weight = bodyWeightKg > 0 ? bodyWeightKg : 70;
  // Simple BMR proportional to weight (sedentary baseline ~24.3 kcal/kg/day)
  const bmr = Math.round(weight * 24.3);

  if (sessions.length === 0) {
    return { tdee: bmr, bmr, isBMROnly: true };
  }

  let workoutKcal = 0;
  for (const s of sessions) {
    const met = MET_BY_TARGET[s.bodyTarget] ?? 6;
    const durationHours = (s.durationMinutes ?? DEFAULT_DURATION_MINUTES) / 60;
    // Calories = MET × weight (kg) × duration (hours)
    workoutKcal += met * weight * durationHours;
  }

  const tdee = Math.round(bmr + workoutKcal);
  return { tdee, bmr, isBMROnly: false };
}
