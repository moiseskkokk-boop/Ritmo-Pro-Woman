import { and, desc, eq, gte, lte } from "drizzle-orm";
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { drizzle } from "drizzle-orm/mysql2";
import { authSessions, bodyAnalyses, bodyAssessments, exerciseCompletions, InsertUser, notificationPreferences, personalizationProfiles, specializationPlans, users, wearableActivities, wearableConnections, workoutSessions } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export const USER_DATA_DELETION_SCOPE = ["bodyAnalyses","specializationPlans","bodyAssessments","personalizationProfiles","notificationPreferences","exerciseCompletions","workoutSessions","wearableActivities","wearableConnections","users"] as const;
export const ASSESSMENT_DATA_DELETION_SCOPE = ["bodyAnalyses","specializationPlans","bodyAssessments"] as const;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) { try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; } }
  return _db;
}

const scrypt = promisify(scryptCallback);
const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");
async function hashPassword(password: string) { const salt=randomBytes(16).toString("hex"); const derived=await scrypt(password,salt,64) as Buffer; return `scrypt$${salt}$${derived.toString("hex")}`; }
async function verifyPassword(password: string, encoded: string) { const [,salt,expected]=encoded.split("$"); if(!salt||!expected)return false; const derived=await scrypt(password,salt,64) as Buffer; return derived.toString("hex")===expected; }
export async function registerLocalUser(name:string,email:string,password:string){ const db=await getDb(); if(!db)throw new Error("Database unavailable"); const normalizedEmail=email.trim().toLowerCase(); const existing=await db.select().from(users).where(eq(users.email,normalizedEmail)).limit(1); if(existing.length)throw new Error("EMAIL_ALREADY_EXISTS"); const openId="local_"+randomUUID().replace(/-/g,"").slice(0,56); const passwordHash=await hashPassword(password); await db.insert(users).values({openId,name:name.trim()||normalizedEmail.split("@")[0],email:normalizedEmail,passwordHash,loginMethod:"email",lastSignedIn:new Date()}); return getUserByOpenId(openId); }
export async function authenticateLocalUser(email:string,password:string){ const db=await getDb(); if(!db)throw new Error("Database unavailable"); const normalizedEmail=email.trim().toLowerCase(); const rows=await db.select().from(users).where(eq(users.email,normalizedEmail)).limit(1); const user=rows[0]; if(!user?.passwordHash||!(await verifyPassword(password,user.passwordHash)))return null; await db.update(users).set({lastSignedIn:new Date()}).where(eq(users.id,user.id)); return {...user,lastSignedIn:new Date()}; }
export async function createAuthSession(userId:number){ const db=await getDb(); if(!db)throw new Error("Database unavailable"); const token=randomBytes(48).toString("base64url"); const expiresAt=new Date(Date.now()+30*24*60*60*1000); await db.insert(authSessions).values({userId,tokenHash:hashSessionToken(token),expiresAt}); return {token,expiresAt}; }
export async function getUserBySessionToken(token:string){ const db=await getDb(); if(!db)return undefined; const rows=await db.select({user:users,session:authSessions}).from(authSessions).innerJoin(users,eq(authSessions.userId,users.id)).where(eq(authSessions.tokenHash,hashSessionToken(token))).limit(1); const row=rows[0]; if(!row)return undefined; if(row.session.expiresAt.getTime()<=Date.now()){await db.delete(authSessions).where(eq(authSessions.id,row.session.id));return undefined;} return row.user; }
export async function deleteAuthSession(token:string){ const db=await getDb(); if(!db)return; await db.delete(authSessions).where(eq(authSessions.tokenHash,hashSessionToken(token))); }

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "profilePhotoKey", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserProfilePhoto(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ profilePhotoKey: users.profilePhotoKey }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.profilePhotoKey ?? null;
}

export async function setUserProfilePhoto(userId: number, profilePhotoKey: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ profilePhotoKey, updatedAt: new Date() }).where(eq(users.id, userId));
  return { profilePhotoKey };
}

export async function getCompletedExerciseIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ exerciseId: exerciseCompletions.exerciseId })
    .from(exerciseCompletions)
    .where(eq(exerciseCompletions.userId, userId));
  return rows.map(row => row.exerciseId);
}

export async function setExerciseCompletion(userId: number, exerciseId: string, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select({ id: exerciseCompletions.id })
    .from(exerciseCompletions)
    .where(and(eq(exerciseCompletions.userId, userId), eq(exerciseCompletions.exerciseId, exerciseId)))
    .limit(1);

  if (completed && existing.length === 0) await db.insert(exerciseCompletions).values({ userId, exerciseId });
  if (!completed && existing.length > 0) await db.delete(exerciseCompletions).where(eq(exerciseCompletions.id, existing[0].id));
  return { completed };
}

export async function getWorkoutSessions(userId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.sessionDate, startDate), lte(workoutSessions.sessionDate, endDate)));
}

export async function setWorkoutSession(userId: number, sessionDate: string, workoutId: string, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.sessionDate, sessionDate)))
    .limit(1);

  if (!completed) {
    if (existing.length > 0) await db.delete(workoutSessions).where(eq(workoutSessions.id, existing[0].id));
    return { sessionDate, workoutId, completed: false };
  }
  if (existing.length > 0) {
    await db.update(workoutSessions).set({ workoutId, completedAt: new Date() }).where(eq(workoutSessions.id, existing[0].id));
  } else {
    await db.insert(workoutSessions).values({ userId, sessionDate, workoutId });
  }
  return { sessionDate, workoutId, completed: true };
}

/** Remove todos os dados criados pelo usuário dentro do Ritmo Pro Woman. */
export async function deleteAllUserData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(bodyAnalyses).where(eq(bodyAnalyses.userId, userId));
  await db.delete(specializationPlans).where(eq(specializationPlans.userId, userId));
  await db.delete(bodyAssessments).where(eq(bodyAssessments.userId, userId));
  await db.delete(personalizationProfiles).where(eq(personalizationProfiles.userId, userId));
  await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
  await db.delete(exerciseCompletions).where(eq(exerciseCompletions.userId, userId));
  await db.delete(workoutSessions).where(eq(workoutSessions.userId, userId));
  await db.delete(wearableActivities).where(eq(wearableActivities.userId, userId));
  await db.delete(wearableConnections).where(eq(wearableConnections.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  return { success: true as const };
}

/** Remove somente as avaliações semanais, fotos referenciadas, análises e planos derivados. */
export async function deleteUserAssessments(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(bodyAnalyses).where(eq(bodyAnalyses.userId, userId));
  await db.delete(specializationPlans).where(eq(specializationPlans.userId, userId));
  await db.delete(bodyAssessments).where(eq(bodyAssessments.userId, userId));

  return { success: true as const };
}

export type WearableActivityInput = {
  provider: string;
  externalId: string;
  activityDate: string;
  startedAt?: string | null;
  activityType?: string | null;
  durationMinutes?: number | null;
  caloriesKcal?: number | null;
  heartRateAvg?: number | null;
  heartRateMax?: number | null;
  steps?: number | null;
  distanceMeters?: number | null;
  rawMetrics?: Record<string, unknown>;
};

export async function getWearableConnections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wearableConnections).where(eq(wearableConnections.userId, userId));
}

export async function upsertWearableConnection(userId: number, provider: string, status: "disconnected" | "connected" | "syncing" | "needs_reconnect") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(wearableConnections).values({ userId, provider, status }).onDuplicateKeyUpdate({ set: { status, updatedAt: new Date() } });
  return getWearableConnections(userId);
}

export async function importWearableActivities(userId: number, activities: WearableActivityInput[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let imported = 0;
  for (const activity of activities) {
    const values = {
      userId,
      provider: activity.provider,
      externalId: activity.externalId,
      activityDate: activity.activityDate,
      startedAt: activity.startedAt ? new Date(activity.startedAt) : null,
      activityType: activity.activityType ?? null,
      durationMinutes: activity.durationMinutes ?? null,
      caloriesKcal: activity.caloriesKcal ?? null,
      heartRateAvg: activity.heartRateAvg ?? null,
      heartRateMax: activity.heartRateMax ?? null,
      steps: activity.steps ?? null,
      distanceMeters: activity.distanceMeters ?? null,
      rawMetricsJson: activity.rawMetrics ? JSON.stringify(activity.rawMetrics) : null,
    };
    const result = await db.insert(wearableActivities).values(values).onDuplicateKeyUpdate({ set: { ...values, userId, provider: activity.provider, externalId: activity.externalId } });
    if (Number(result[0].affectedRows ?? 0) > 0) imported += 1;
  }
  const provider = activities[0]?.provider;
  if (provider) {
    await db.insert(wearableConnections).values({ userId, provider, status: "connected", lastSyncedAt: new Date() }).onDuplicateKeyUpdate({ set: { status: "connected", lastSyncedAt: new Date(), updatedAt: new Date() } });
  }
  return { imported, received: activities.length };
}

export async function getWearableActivities(userId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wearableActivities).where(and(eq(wearableActivities.userId, userId), gte(wearableActivities.activityDate, startDate), lte(wearableActivities.activityDate, endDate))).orderBy(desc(wearableActivities.activityDate));
}

export async function getPersonalizationProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(personalizationProfiles).where(eq(personalizationProfiles.userId, userId)).limit(1);
  return rows[0];
}

export async function savePersonalizationProfile(userId: number, values: {
  language?: "pt" | "en" | "es";
  consent?: boolean;
  goal?: string | null;
  healthNotes?: string | null;
  heightCm?: string | null;
  weightKg?: string | null;
  measurementsJson?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getPersonalizationProfile(userId);
  const data = {
    userId,
    language: values.language ?? current?.language ?? "pt",
    consentAt: values.consent ? new Date() : current?.consentAt ?? null,
    goal: values.goal === undefined ? current?.goal ?? null : values.goal,
    healthNotes: values.healthNotes === undefined ? current?.healthNotes ?? null : values.healthNotes,
    heightCm: values.heightCm === undefined ? current?.heightCm ?? null : values.heightCm,
    weightKg: values.weightKg === undefined ? current?.weightKg ?? null : values.weightKg,
    measurementsJson: values.measurementsJson === undefined ? current?.measurementsJson ?? null : values.measurementsJson,
  } as const;
  await db.insert(personalizationProfiles).values(data).onDuplicateKeyUpdate({
    set: {
      language: data.language,
      ...(values.consent ? { consentAt: data.consentAt } : {}),
      goal: data.goal,
      healthNotes: data.healthNotes,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      measurementsJson: data.measurementsJson,
      updatedAt: new Date(),
    },
  });
  return getPersonalizationProfile(userId);
}

export type NotificationPreferenceInput = {
  enabled?: boolean;
  browserEnabled?: boolean;
  dailyReminder?: boolean;
  reminderTime?: string;
  reminderDaysJson?: string;
  weeklySummary?: boolean;
  weeklyDay?: string;
  weeklyTime?: string;
  monthlyCheckIn?: boolean;
  quietStart?: string;
  quietEnd?: string;
  customMessage?: string | null;
};

const defaultNotificationPreferences = {
  enabled: true,
  browserEnabled: false,
  dailyReminder: true,
  reminderTime: "18:00",
  reminderDaysJson: '["1","2","3","4","5"]',
  weeklySummary: true,
  weeklyDay: "0",
  weeklyTime: "20:00",
  monthlyCheckIn: true,
  quietStart: "22:00",
  quietEnd: "07:00",
  customMessage: null,
};

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return { userId, ...defaultNotificationPreferences, reminderDays: ["1", "2", "3", "4", "5"] };
  const rows = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return { userId, ...defaultNotificationPreferences, reminderDays: ["1", "2", "3", "4", "5"] };
  return {
    ...row,
    enabled: Boolean(row.enabled),
    browserEnabled: Boolean(row.browserEnabled),
    dailyReminder: Boolean(row.dailyReminder),
    weeklySummary: Boolean(row.weeklySummary),
    monthlyCheckIn: Boolean(row.monthlyCheckIn),
    reminderDays: JSON.parse(row.reminderDaysJson || defaultNotificationPreferences.reminderDaysJson) as string[],
  };
}

export async function saveNotificationPreferences(userId: number, input: NotificationPreferenceInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getNotificationPreferences(userId);
  const values = {
    userId,
    enabled: (input.enabled ?? current.enabled) ? 1 : 0,
    browserEnabled: (input.browserEnabled ?? current.browserEnabled) ? 1 : 0,
    dailyReminder: (input.dailyReminder ?? current.dailyReminder) ? 1 : 0,
    reminderTime: input.reminderTime ?? current.reminderTime,
    reminderDaysJson: input.reminderDaysJson ?? JSON.stringify(current.reminderDays),
    weeklySummary: (input.weeklySummary ?? current.weeklySummary) ? 1 : 0,
    weeklyDay: input.weeklyDay ?? current.weeklyDay,
    weeklyTime: input.weeklyTime ?? current.weeklyTime,
    monthlyCheckIn: (input.monthlyCheckIn ?? current.monthlyCheckIn) ? 1 : 0,
    quietStart: input.quietStart ?? current.quietStart,
    quietEnd: input.quietEnd ?? current.quietEnd,
    customMessage: input.customMessage === undefined ? current.customMessage : input.customMessage,
  };
  await db.insert(notificationPreferences).values(values).onDuplicateKeyUpdate({ set: { enabled: values.enabled, browserEnabled: values.browserEnabled, dailyReminder: values.dailyReminder, reminderTime: values.reminderTime, reminderDaysJson: values.reminderDaysJson, weeklySummary: values.weeklySummary, weeklyDay: values.weeklyDay, weeklyTime: values.weeklyTime, monthlyCheckIn: values.monthlyCheckIn, quietStart: values.quietStart, quietEnd: values.quietEnd, customMessage: values.customMessage, updatedAt: new Date() } });
  return getNotificationPreferences(userId);
}

export async function createBodyAssessment(userId: number, values: {
  label: string;
  assessmentDate: string;
  weekKey?: string | null;
  frontKey: string;
  sideKey: string;
  backKey: string;
  heightCm?: string | null;
  weightKg?: string | null;
  measurementsJson?: string | null;
  trainingNotes?: string | null;
  qualityJson?: string | null;
  trainingDataJson?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (values.weekKey) {
    const existing = await db.select({ id: bodyAssessments.id }).from(bodyAssessments).where(and(eq(bodyAssessments.userId, userId), eq(bodyAssessments.weekKey, values.weekKey))).limit(1);
    if (existing[0]) {
      await db.update(bodyAssessments).set(values).where(and(eq(bodyAssessments.id, existing[0].id), eq(bodyAssessments.userId, userId)));
      const rows = await db.select().from(bodyAssessments).where(and(eq(bodyAssessments.id, existing[0].id), eq(bodyAssessments.userId, userId))).limit(1);
      return rows[0];
    }
  }
  const result = await db.insert(bodyAssessments).values({ userId, ...values });
  const id = Number(result[0].insertId);
  const rows = await db.select().from(bodyAssessments).where(and(eq(bodyAssessments.id, id), eq(bodyAssessments.userId, userId))).limit(1);
  return rows[0];
}

export async function getBodyAssessments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bodyAssessments).where(eq(bodyAssessments.userId, userId)).orderBy(desc(bodyAssessments.assessmentDate));
}

export async function getBodyAssessment(userId: number, assessmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(bodyAssessments).where(and(eq(bodyAssessments.userId, userId), eq(bodyAssessments.id, assessmentId))).limit(1);
  return rows[0];
}

export async function createBodyAnalysis(userId: number, values: {
  assessmentId: number;
  language: "pt" | "en" | "es";
  confidence: number;
  resultJson: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bodyAnalyses).values({ userId, ...values });
  const id = Number(result[0].insertId);
  const rows = await db.select().from(bodyAnalyses).where(and(eq(bodyAnalyses.id, id), eq(bodyAnalyses.userId, userId))).limit(1);
  return rows[0];
}

export async function getBodyAnalyses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bodyAnalyses).where(eq(bodyAnalyses.userId, userId)).orderBy(desc(bodyAnalyses.createdAt));
}

export async function createSpecializationPlan(userId: number, values: {
  analysisId: number;
  active: boolean;
  focus: string;
  rationale: string;
  confidence: number;
  sessionJson?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (values.active) await db.update(specializationPlans).set({ active: 0 }).where(eq(specializationPlans.userId, userId));
  const result = await db.insert(specializationPlans).values({ userId, ...values, active: values.active ? 1 : 0 });
  const id = Number(result[0].insertId);
  const rows = await db.select().from(specializationPlans).where(and(eq(specializationPlans.id, id), eq(specializationPlans.userId, userId))).limit(1);
  return rows[0];
}

export async function getActiveSpecializationPlan(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(specializationPlans).where(and(eq(specializationPlans.userId, userId), eq(specializationPlans.active, 1))).orderBy(desc(specializationPlans.createdAt)).limit(1);
  return rows[0];
}

