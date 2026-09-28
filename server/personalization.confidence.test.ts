import { describe, expect, it } from "vitest";
import { calculateConfidence } from "./routers/personalization";

const baseInput = {
  hasPrevious: false,
  hasHeight: false,
  hasWeight: false,
  hasMeasurements: false,
  hasNotes: false,
  quality: [],
};

describe("personalization confidence", () => {
  it("adds height and weight as contextual data without exceeding the cap", () => {
    expect(calculateConfidence(baseInput)).toBe(24);
    expect(calculateConfidence({ ...baseInput, hasHeight: true })).toBe(28);
    expect(calculateConfidence({ ...baseInput, hasHeight: true, hasWeight: true })).toBe(36);
  });

  it("caps confidence even when all available signals are present", () => {
    const quality = [1, 2, 3].map(() => ({
      width: 1200,
      height: 1200,
      bytes: 150_000,
      aspect: 0.8,
      consistency: { lighting: true, distance: true, posture: true, clothing: true, environment: true },
    }));
    expect(calculateConfidence({ ...baseInput, hasPrevious: true, hasHeight: true, hasWeight: true, hasMeasurements: true, hasNotes: true, quality })).toBe(94);
  });
});
