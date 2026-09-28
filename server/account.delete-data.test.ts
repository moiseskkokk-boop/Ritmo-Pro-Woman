import { describe, expect, it } from "vitest";
import { ASSESSMENT_DATA_DELETION_SCOPE, USER_DATA_DELETION_SCOPE } from "./db";

describe("account data deletion scope", () => {
  it("includes private assessments, progress, notifications and local identity", () => {
    expect(USER_DATA_DELETION_SCOPE).toEqual([
      "bodyAnalyses",
      "specializationPlans",
      "bodyAssessments",
      "personalizationProfiles",
      "notificationPreferences",
      "exerciseCompletions",
      "workoutSessions",
      "wearableActivities",
      "wearableConnections",
      "users",
    ]);
  });

  it("keeps assessment-only deletion limited to assessments and derived results", () => {
    expect(ASSESSMENT_DATA_DELETION_SCOPE).toEqual(["bodyAnalyses", "specializationPlans", "bodyAssessments"]);
  });
});
