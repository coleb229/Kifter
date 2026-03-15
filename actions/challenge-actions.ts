"use server";

import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import {
  getChallengesCollection,
  getSessionsCollection,
  getCardioSessionsCollection,
  getSetsCollection,
  getUsersCollection,
} from "@/lib/db";
import type {
  ActionResult,
  Challenge,
  ChallengeDoc,
  ChallengeMetric,
  ChallengeParticipant,
} from "@/types";

function toLb(weight: number, unit: string): number {
  return unit === "kg" ? weight * 2.20462 : weight;
}

async function computeMetricValue(
  userId: string,
  metric: ChallengeMetric,
  startDate: string,
  endDate: string
): Promise<number> {
  const start = new Date(startDate);
  const end = new Date(endDate + "T23:59:59.999Z");

  if (metric === "workout_count") {
    const sessionsCol = await getSessionsCollection();
    return sessionsCol.countDocuments({ userId, date: { $gte: start, $lte: end } });
  }

  if (metric === "cardio_distance") {
    const cardioCol = await getCardioSessionsCollection();
    const sessions = await cardioCol.find({ userId, date: { $gte: start, $lte: end } }).toArray();
    return sessions.reduce((sum, s) => {
      if (!s.distance) return sum;
      return sum + (s.distanceUnit === "mi" ? s.distance * 1.60934 : s.distance);
    }, 0);
  }

  // total_volume
  const sessionsCol = await getSessionsCollection();
  const sessionDocs = await sessionsCol
    .find({ userId, date: { $gte: start, $lte: end } })
    .project<{ _id: import("mongodb").ObjectId }>({ _id: 1 })
    .toArray();
  const sessionIds = sessionDocs.map((d) => d._id.toHexString());
  if (sessionIds.length === 0) return 0;
  const setsCol = await getSetsCollection();
  const sets = await setsCol.find({ userId, sessionId: { $in: sessionIds }, completed: true }).toArray();
  return sets.reduce((sum, s) => sum + toLb(s.weight, s.weightUnit ?? "lb") * s.reps, 0);
}

export async function createChallenge(data: {
  title: string;
  description?: string;
  metric: ChallengeMetric;
  targetValue: number;
}): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  if (!data.title.trim()) return { success: false, error: "Title is required" };
  if (data.targetValue <= 0) return { success: false, error: "Target value must be positive" };

  const startDate = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const col = await getChallengesCollection();
  const _id = new ObjectId();
  await col.insertOne({
    _id,
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    creatorId: session.user.id,
    metric: data.metric,
    targetValue: data.targetValue,
    startDate,
    endDate,
    participantIds: [session.user.id],
    status: "active",
    createdAt: new Date(),
  } as ChallengeDoc);

  return { success: true, data: { id: _id.toHexString() } };
}

export async function joinChallenge(challengeId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try { objectId = new ObjectId(challengeId); } catch { return { success: false, error: "Invalid challenge ID" }; }

  const col = await getChallengesCollection();
  await col.updateOne(
    { _id: objectId, status: "active" },
    { $addToSet: { participantIds: session.user.id } }
  );
  return { success: true, data: undefined };
}

export async function leaveChallenge(challengeId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try { objectId = new ObjectId(challengeId); } catch { return { success: false, error: "Invalid challenge ID" }; }

  const col = await getChallengesCollection();
  const challenge = await col.findOne({ _id: objectId });
  if (!challenge) return { success: false, error: "Challenge not found" };
  if (challenge.creatorId === session.user.id) return { success: false, error: "Creator cannot leave the challenge" };

  await col.updateOne({ _id: objectId }, { $pull: { participantIds: session.user.id } });
  return { success: true, data: undefined };
}

export async function deleteChallenge(challengeId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try { objectId = new ObjectId(challengeId); } catch { return { success: false, error: "Invalid challenge ID" }; }

  const col = await getChallengesCollection();
  const challenge = await col.findOne({ _id: objectId });
  if (!challenge) return { success: false, error: "Challenge not found" };

  const isCreator = challenge.creatorId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isCreator && !isAdmin) return { success: false, error: "Not authorized" };

  await col.deleteOne({ _id: objectId });
  return { success: true, data: undefined };
}

export async function getChallenges(): Promise<ActionResult<Challenge[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const userId = session.user.id;
  const col = await getChallengesCollection();
  const docs = await col.find({ status: "active" }).sort({ createdAt: -1 }).toArray();

  if (docs.length === 0) return { success: true, data: [] };

  // Batch-fetch creator names
  const creatorIds = [...new Set(docs.map((d) => d.creatorId))];
  const usersCol = await getUsersCollection();
  const creators = await usersCol
    .find({ _id: { $in: creatorIds.map((id) => new ObjectId(id)) } })
    .project<{ _id: import("mongodb").ObjectId; name?: string; displayName?: string }>({ name: 1, displayName: 1 })
    .toArray();
  const creatorMap = new Map(creators.map((c) => [c._id.toHexString(), c.displayName ?? c.name ?? "Unknown"]));

  const now = Date.now();
  const challenges: Challenge[] = await Promise.all(
    docs.map(async (doc) => {
      const myCurrentValue = await computeMetricValue(userId, doc.metric, doc.startDate, doc.endDate);
      const myPercentComplete = Math.min(100, Math.round((myCurrentValue / doc.targetValue) * 100));
      const daysRemaining = Math.max(0, Math.ceil((new Date(doc.endDate).getTime() - now) / 86400000));
      return {
        id: doc._id.toHexString(),
        title: doc.title,
        description: doc.description,
        creatorId: doc.creatorId,
        creatorName: creatorMap.get(doc.creatorId) ?? "Unknown",
        metric: doc.metric,
        targetValue: doc.targetValue,
        startDate: doc.startDate,
        endDate: doc.endDate,
        participantCount: doc.participantIds.length,
        isParticipating: doc.participantIds.includes(userId),
        myCurrentValue: Math.round(myCurrentValue * 10) / 10,
        myPercentComplete,
        status: doc.status,
        daysRemaining,
        createdAt: doc.createdAt.toISOString(),
      };
    })
  );

  return { success: true, data: challenges };
}

export async function getChallengeLeaderboard(
  challengeId: string
): Promise<ActionResult<ChallengeParticipant[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  let objectId: ObjectId;
  try { objectId = new ObjectId(challengeId); } catch { return { success: false, error: "Invalid challenge ID" }; }

  const col = await getChallengesCollection();
  const challenge = await col.findOne({ _id: objectId });
  if (!challenge) return { success: false, error: "Challenge not found" };
  if (!challenge.participantIds.includes(session.user.id)) return { success: false, error: "Not a participant" };

  const usersCol = await getUsersCollection();
  const users = await usersCol
    .find({ _id: { $in: challenge.participantIds.map((id) => new ObjectId(id)) } })
    .project<{ _id: import("mongodb").ObjectId; name?: string; displayName?: string; profileImage?: string; image?: string }>({ name: 1, displayName: 1, profileImage: 1, image: 1 })
    .toArray();
  const userMap = new Map(users.map((u) => [u._id.toHexString(), u]));

  const participants: ChallengeParticipant[] = await Promise.all(
    challenge.participantIds.map(async (uid) => {
      const u = userMap.get(uid);
      const currentValue = await computeMetricValue(uid, challenge.metric, challenge.startDate, challenge.endDate);
      const percentComplete = Math.min(100, Math.round((currentValue / challenge.targetValue) * 100));
      return {
        userId: uid,
        displayName: u?.displayName ?? u?.name ?? "Unknown",
        profileImage: u?.profileImage ?? u?.image ?? undefined,
        currentValue: Math.round(currentValue * 10) / 10,
        percentComplete,
      };
    })
  );

  participants.sort((a, b) => b.currentValue - a.currentValue);
  return { success: true, data: participants };
}
