import { unzipSync, gunzipSync, strFromU8 } from "fflate";
import type { ParsedAppleHealthWorkout } from "@/types";

function getAttr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : "";
}

function getWorkoutStat(
  block: string,
  typeSubstr: string
): { value: number; unit: string } | undefined {
  const wsRe = /<WorkoutStatistics\s((?:"[^"]*"|[^>])*)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = wsRe.exec(block)) !== null) {
    const attrs = m[1];
    if (!getAttr(attrs, "type").includes(typeSubstr)) continue;
    const val = parseFloat(getAttr(attrs, "sum"));
    if (!isNaN(val) && val > 0) {
      return { value: val, unit: getAttr(attrs, "unit") };
    }
  }
  return undefined;
}

function getWorkoutStatHR(
  block: string
): { avg: number; min: number; max: number } | undefined {
  const wsRe = /<WorkoutStatistics\s((?:"[^"]*"|[^>])*)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = wsRe.exec(block)) !== null) {
    const attrs = m[1];
    if (!getAttr(attrs, "type").includes("HeartRate")) continue;
    const avg = parseFloat(getAttr(attrs, "average"));
    if (isNaN(avg) || avg <= 0) continue;
    const min = parseFloat(getAttr(attrs, "minimum"));
    const max = parseFloat(getAttr(attrs, "maximum"));
    return {
      avg: Math.round(avg),
      min: isNaN(min) ? Math.round(avg) : Math.round(min),
      max: isNaN(max) ? Math.round(avg) : Math.round(max),
    };
  }
  return undefined;
}

export function parseWorkoutsFromXML(xmlText: string): ParsedAppleHealthWorkout[] {
  const workouts: ParsedAppleHealthWorkout[] = [];
  const workoutTagRe = /<Workout\s((?:"[^"]*"|[^>])*)(\s*\/?>)/g;
  let match: RegExpExecArray | null;

  while ((match = workoutTagRe.exec(xmlText)) !== null) {
    const attrs = match[1];
    const isSelfClosing = match[2].trimStart().startsWith("/");
    const tagEnd = match.index + match[0].length;

    const activityType = getAttr(attrs, "workoutActivityType");
    if (!activityType) continue;

    const startDate = getAttr(attrs, "startDate");
    if (!startDate) continue;

    const durationRaw = parseFloat(getAttr(attrs, "duration") || "0");
    const durationUnit = getAttr(attrs, "durationUnit") || "min";
    const durationMin = durationUnit === "s" ? durationRaw / 60 : durationRaw;
    if (durationMin <= 0) continue;

    let blockContent = "";
    if (!isSelfClosing) {
      const closeIdx = xmlText.indexOf("</Workout>", tagEnd);
      if (closeIdx !== -1) blockContent = xmlText.slice(tagEnd, closeIdx);
    }

    // Calories
    let calRaw = parseFloat(getAttr(attrs, "totalEnergyBurned") || "");
    if ((isNaN(calRaw) || calRaw <= 0) && blockContent) {
      const stat = getWorkoutStat(blockContent, "EnergyBurned");
      if (stat) calRaw = stat.value;
    }
    const caloriesBurned = !isNaN(calRaw) && calRaw > 0 ? Math.round(calRaw) : undefined;

    // Distance
    let distRaw = parseFloat(getAttr(attrs, "totalDistance") || "");
    let distUnit = getAttr(attrs, "totalDistanceUnit");
    if ((isNaN(distRaw) || distRaw <= 0) && blockContent) {
      const stat = getWorkoutStat(blockContent, "Distance");
      if (stat) { distRaw = stat.value; distUnit = stat.unit; }
    }
    const distance = !isNaN(distRaw) && distRaw > 0 ? distRaw : undefined;
    const distanceUnit = distance ? (distUnit || "km") : undefined;

    // Heart rate
    const hr = blockContent ? getWorkoutStatHR(blockContent) : undefined;

    workouts.push({
      activityType,
      startDate,
      durationMin: Math.round(durationMin),
      caloriesBurned,
      distance,
      distanceUnit,
      heartRateAvg: hr?.avg,
      heartRateMin: hr?.min,
      heartRateMax: hr?.max,
    });
  }

  return workouts;
}

export async function parseAppleHealthFile(file: File): Promise<ParsedAppleHealthWorkout[]> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isZip  = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;

  let xmlText: string;

  if (isZip) {
    const files = unzipSync(bytes);
    const entry =
      files["apple_health_export/export.xml"] ??
      Object.entries(files).find(([k]) => k.endsWith("export.xml"))?.[1];
    if (!entry) throw new Error("Could not find export.xml inside the zip file.");
    xmlText = strFromU8(entry);
  } else if (isGzip) {
    xmlText = strFromU8(gunzipSync(bytes));
  } else {
    xmlText = new TextDecoder().decode(bytes);
    if (!xmlText.includes("<HealthData")) {
      throw new Error(
        "Unrecognized file format. Please upload export.xml or the Apple Health .zip export."
      );
    }
  }

  return parseWorkoutsFromXML(xmlText);
}
