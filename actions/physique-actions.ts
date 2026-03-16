"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getPhysiqueMeasurementsCollection } from "@/lib/db";
import type { ActionResult, PhysiqueMeasurement, MeasurementUnit } from "@/types";

export async function addPhysiqueMeasurement(data: {
  date: string;
  unit: MeasurementUnit;
  neck?: number;
  waist?: number;
  hips?: number;
  chest?: number;
  bicepsL?: number;
  bicepsR?: number;
  thighL?: number;
  thighR?: number;
  height?: number;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getPhysiqueMeasurementsCollection();
  await col.insertOne({
    _id: new ObjectId(),
    userId: session.user.id,
    ...data,
    createdAt: new Date(),
  });
  return { success: true, data: undefined };
}

export async function getPhysiqueMeasurements(): Promise<ActionResult<PhysiqueMeasurement[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getPhysiqueMeasurementsCollection();
  const docs = await col
    .find({ userId: session.user.id })
    .sort({ date: 1 })
    .limit(120)
    .toArray();

  return {
    success: true,
    data: docs.map((d) => ({
      id: d._id.toHexString(),
      date: d.date,
      unit: d.unit,
      neck: d.neck,
      waist: d.waist,
      hips: d.hips,
      chest: d.chest,
      bicepsL: d.bicepsL,
      bicepsR: d.bicepsR,
      thighL: d.thighL,
      thighR: d.thighR,
      height: d.height,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

export async function deletePhysiqueMeasurement(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const col = await getPhysiqueMeasurementsCollection();
  await col.deleteOne({ _id: new ObjectId(id), userId: session.user.id });
  return { success: true, data: undefined };
}
