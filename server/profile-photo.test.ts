import { describe, expect, it } from "vitest";
import { decodeProfilePhotoDataUrl } from "./profilePhoto";

describe("profile photo validation", () => {
  it("accepts supported image data URLs and normalizes jpg", () => {
    const result = decodeProfilePhotoDataUrl(`data:image/jpg;base64,${Buffer.from("photo").toString("base64")}`);
    expect(result?.contentType).toBe("image/jpeg");
    expect(result?.extension).toBe("jpeg");
    expect(result?.buffer.length).toBe(5);
  });

  it("rejects non-image payloads and empty data", () => {
    expect(decodeProfilePhotoDataUrl("data:text/plain;base64,cGhvdG8=")).toBeNull();
    expect(decodeProfilePhotoDataUrl("data:image/png;base64,")).toBeNull();
  });
});
