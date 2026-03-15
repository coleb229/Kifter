"use server";

import { auth } from "@/auth";
import { getSessionsCollection, getSetsCollection, getDietEntriesCollection } from "@/lib/db";
import type { ActionResult } from "@/types";

function escapeCsv(val: string | number | undefined): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(cells: (string | number | undefined)[]) {
  return cells.map(escapeCsv).join(",");
}

export async function exportWorkoutsCSV(): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const [sessionsCol, setsCol] = await Promise.all([
    getSessionsCollection(),
    getSetsCollection(),
  ]);

  const [sessions, sets] = await Promise.all([
    sessionsCol.find({ userId }).sort({ date: 1 }).toArray(),
    setsCol.find({ userId }).sort({ createdAt: 1 }).toArray(),
  ]);

  const sessionMap = new Map(sessions.map((s) => [s._id.toHexString(), s]));

  const lines = [
    row(["date", "sessionName", "bodyTarget", "exercise", "setNumber", "weight", "weightUnit", "reps"]),
  ];

  for (const set of sets) {
    const s = sessionMap.get(set.sessionId);
    if (!s) continue;
    lines.push(row([
      s.date.toISOString().slice(0, 10),
      s.name ?? "",
      s.bodyTarget,
      set.exercise,
      set.setNumber,
      set.weight,
      set.weightUnit ?? "lb",
      set.reps,
    ]));
  }

  return { success: true, data: lines.join("\n") };
}

export async function exportDietCSV(): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getDietEntriesCollection();
  const entries = await col.find({ userId: session.user.id }).sort({ date: 1 }).toArray();

  const lines = [
    row(["date", "mealType", "food", "calories", "protein", "carbs", "fat", "notes"]),
  ];

  for (const e of entries) {
    lines.push(row([
      e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10),
      e.mealType,
      e.food,
      e.calories,
      e.protein,
      e.carbs,
      e.fat,
      e.notes ?? "",
    ]));
  }

  return { success: true, data: lines.join("\n") };
}
