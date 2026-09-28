
import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  profilePhotoKey: varchar("profilePhotoKey", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const authSessions = mysqlTable("auth_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ userToken: uniqueIndex("auth_sessions_user_token").on(table.userId, table.tokenHash) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** One row per authenticated user and exercise. */
export const exerciseCompletions = mysqlTable(
  "exercise_completions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    exerciseId: varchar("exerciseId", { length: 128 }).notNull(),
    completedAt: timestamp("completedAt").defaultNow().notNull(),
  },
  table => ({
    userExerciseUnique: uniqueIndex("user_exercise_unique").on(table.userId, table.exerciseId),
  }),
);

export type ExerciseCompletion = typeof exerciseCompletions.$inferSelect;
export type InsertExerciseCompletion = typeof exerciseCompletions.$inferInsert;

/** One row per authenticated user and calendar day. */
export const workoutSessions = mysqlTable(
  "workout_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    sessionDate: varchar("sessionDate", { length: 10 }).notNull(),
    workoutId: varchar("workoutId", { length: 32 }).notNull(),
    completedAt: timestamp("completedAt").defaultNow().notNull(),
  },
  table => ({
    userDateUnique: uniqueIndex("user_date_unique").on(table.userId, table.sessionDate),
  }),
);

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = typeof workoutSessions.$inferInsert;

/** Private personalization profile and required consent. */
export const personalizationProfiles = mysqlTable("personalization_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  language: mysqlEnum("language", ["pt", "en", "es"]).default("pt").notNull(),
  consentAt: timestamp("consentAt"),
  goal: varchar("goal", { length: 255 }),
  healthNotes: text("healthNotes"),
  heightCm: varchar("heightCm", { length: 32 }),
  weightKg: varchar("weightKg", { length: 32 }),
  measurementsJson: text("measurementsJson"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PersonalizationProfile = typeof personalizationProfiles.$inferSelect;
export type InsertPersonalizationProfile = typeof personalizationProfiles.$inferInsert;

/** Per-user reminder preferences for in-app and browser notifications. */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  enabled: int("enabled").default(1).notNull(),
  browserEnabled: int("browserEnabled").default(0).notNull(),
  dailyReminder: int("dailyReminder").default(1).notNull(),
  reminderTime: varchar("reminderTime", { length: 5 }).default("18:00").notNull(),
  reminderDaysJson: text("reminderDaysJson"),
  weeklySummary: int("weeklySummary").default(1).notNull(),
  weeklyDay: varchar("weeklyDay", { length: 1 }).default("0").notNull(),
  weeklyTime: varchar("weeklyTime", { length: 5 }).default("20:00").notNull(),
  monthlyCheckIn: int("monthlyCheckIn").default(1).notNull(),
  quietStart: varchar("quietStart", { length: 5 }).default("22:00").notNull(),
  quietEnd: varchar("quietEnd", { length: 5 }).default("07:00").notNull(),
  customMessage: varchar("customMessage", { length: 180 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

/** One private, standardized front/side/back photo set per assessment cycle. */
export const bodyAssessments = mysqlTable("body_assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 64 }).notNull(),
  assessmentDate: varchar("assessmentDate", { length: 10 }).notNull(),
  weekKey: varchar("weekKey", { length: 10 }),
  frontKey: varchar("frontKey", { length: 255 }).notNull(),
  sideKey: varchar("sideKey", { length: 255 }).notNull(),
  backKey: varchar("backKey", { length: 255 }).notNull(),
  heightCm: varchar("heightCm", { length: 32 }),
  weightKg: varchar("weightKg", { length: 32 }),
  measurementsJson: text("measurementsJson"),
  trainingNotes: text("trainingNotes"),
  qualityJson: text("qualityJson"),
  trainingDataJson: text("trainingDataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BodyAssessment = typeof bodyAssessments.$inferSelect;
export type InsertBodyAssessment = typeof bodyAssessments.$inferInsert;

/** Structured, transparent AI result tied to an assessment. */
export const bodyAnalyses = mysqlTable("body_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentId: int("assessmentId").notNull(),
  language: mysqlEnum("language", ["pt", "en", "es"]).notNull(),
  confidence: int("confidence").notNull(),
  resultJson: text("resultJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BodyAnalysis = typeof bodyAnalyses.$inferSelect;
export type InsertBodyAnalysis = typeof bodyAnalyses.$inferInsert;

/** Dynamic, explainable fifth-session recommendation for a cycle. */
export const specializationPlans = mysqlTable("specialization_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  analysisId: int("analysisId").notNull(),
  active: int("active").default(0).notNull(),
  focus: varchar("focus", { length: 128 }).notNull(),
  rationale: text("rationale").notNull(),
  confidence: int("confidence").notNull(),
  sessionJson: text("sessionJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpecializationPlan = typeof specializationPlans.$inferSelect;
export type InsertSpecializationPlan = typeof specializationPlans.$inferInsert;

/** Official wearable connection metadata; tokens are never stored in this table. */
export const wearableConnections = mysqlTable("wearable_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["disconnected", "connected", "syncing", "needs_reconnect"]).default("disconnected").notNull(),
  externalAccountId: varchar("externalAccountId", { length: 255 }),
  scopesJson: text("scopesJson"),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userProviderUnique: uniqueIndex("wearable_user_provider_unique").on(table.userId, table.provider),
}));

export type WearableConnection = typeof wearableConnections.$inferSelect;

/** Normalized activity records imported from an official wearable platform. */
export const wearableActivities = mysqlTable("wearable_activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  externalId: varchar("externalId", { length: 255 }).notNull(),
  activityDate: varchar("activityDate", { length: 10 }).notNull(),
  startedAt: timestamp("startedAt"),
  activityType: varchar("activityType", { length: 128 }),
  durationMinutes: int("durationMinutes"),
  caloriesKcal: int("caloriesKcal"),
  heartRateAvg: int("heartRateAvg"),
  heartRateMax: int("heartRateMax"),
  steps: int("steps"),
  distanceMeters: int("distanceMeters"),
  rawMetricsJson: text("rawMetricsJson"),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
}, table => ({
  providerActivityUnique: uniqueIndex("wearable_provider_activity_unique").on(table.userId, table.provider, table.externalId),
}));

export type WearableActivity = typeof wearableActivities.$inferSelect;

