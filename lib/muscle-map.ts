import type { MuscleGroup } from "@/types";

/**
 * Static map from exercise name (lowercase) to primary muscle group.
 * Covers DEFAULT_EXERCISES plus common variations.
 */
export const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup> = {
  // Chest
  "bench press": "Chest",
  "incline bench press": "Chest",
  "decline bench press": "Chest",
  "dumbbell press": "Chest",
  "push-up": "Chest",
  "push up": "Chest",
  "pec fly": "Chest",
  "cable fly": "Chest",
  "chest fly": "Chest",
  "chest press": "Chest",
  "dip": "Chest",
  "dips": "Chest",

  // Shoulders
  "overhead press": "Shoulders",
  "shoulder press": "Shoulders",
  "ohp": "Shoulders",
  "lateral raise": "Shoulders",
  "front raise": "Shoulders",
  "arnold press": "Shoulders",
  "face pull": "Shoulders",
  "upright row": "Shoulders",
  "military press": "Shoulders",

  // Triceps
  "tricep extension": "Triceps",
  "tricep pushdown": "Triceps",
  "skull crusher": "Triceps",
  "close grip bench": "Triceps",
  "overhead tricep extension": "Triceps",
  "tricep dip": "Triceps",

  // Biceps
  "bicep curl": "Biceps",
  "hammer curl": "Biceps",
  "preacher curl": "Biceps",
  "concentration curl": "Biceps",
  "incline curl": "Biceps",
  "cable curl": "Biceps",
  "ez bar curl": "Biceps",

  // Back
  "rows": "Back",
  "row": "Back",
  "barbell row": "Back",
  "dumbbell row": "Back",
  "cable row": "Back",
  "lat pull-down": "Back",
  "lat pulldown": "Back",
  "assisted pull-up": "Back",
  "pull-up": "Back",
  "pull up": "Back",
  "chin-up": "Back",
  "deadlift": "Back",
  "romanian deadlift": "Back",
  "stiff leg deadlift": "Hamstrings",
  "t-bar row": "Back",
  "seated cable row": "Back",
  "hyperextension": "Back",

  // Core
  "crunches": "Core",
  "crunch": "Core",
  "plank": "Core",
  "sit-up": "Core",
  "sit up": "Core",
  "leg raise": "Core",
  "hanging leg raise": "Core",
  "ab wheel": "Core",
  "russian twist": "Core",
  "cable crunch": "Core",
  "abd": "Core",
  "add": "Hip Flexors",

  // Quads
  "squat": "Quads",
  "back squat": "Quads",
  "front squat": "Quads",
  "leg press": "Quads",
  "hack squat": "Quads",
  "leg extension": "Quads",
  "lunge": "Quads",
  "split squat": "Quads",
  "bulgarian split squat": "Quads",
  "step up": "Quads",

  // Hamstrings
  "seated leg curl": "Hamstrings",
  "lying leg curl": "Hamstrings",
  "leg curl": "Hamstrings",
  "nordic curl": "Hamstrings",
  "good morning": "Hamstrings",

  // Glutes
  "hip thrust": "Glutes",
  "glute bridge": "Glutes",
  "sumo squat": "Glutes",
  "sumo deadlift": "Glutes",
  "cable kickback": "Glutes",
  "donkey kick": "Glutes",

  // Calves
  "calf raises": "Calves",
  "calf raise": "Calves",
  "seated calf raise": "Calves",
  "standing calf raise": "Calves",
  "leg press calf raise": "Calves",
};

export function getMuscleGroupForExercise(exerciseName: string): MuscleGroup {
  return EXERCISE_MUSCLE_MAP[exerciseName.toLowerCase().trim()] ?? "Other";
}
