import { describe, expect, it } from "vitest";
import { summarizeActivities } from "./routers/personalization";

describe("wearable activity summary", () => {
  it("aggregates only metrics that were actually provided", () => {
    const result = summarizeActivities([
      { caloriesKcal: 300, durationMinutes: 40, activityType: "cardio", heartRateAvg: 140, heartRateMax: 165, steps: 4000, distanceMeters: 3200 },
      { caloriesKcal: null, durationMinutes: 30, activityType: "strength", heartRateAvg: null, heartRateMax: null, steps: null, distanceMeters: null },
    ] as never);

    expect(result).toMatchObject({ activities: 2, caloriesKcal: 300, durationMinutes: 70, cardioMinutes: 40, heartRateAvg: 140, heartRateMax: 165, steps: 4000, distanceMeters: 3200 });
  });

  it("returns null for unavailable metrics instead of creating zero values", () => {
    expect(summarizeActivities([] as never)).toEqual({ activities: 0, caloriesKcal: null, durationMinutes: null, cardioMinutes: null, heartRateAvg: null, heartRateMax: null, steps: null, distanceMeters: null });
  });
});
