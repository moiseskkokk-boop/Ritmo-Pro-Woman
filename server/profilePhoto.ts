export const PROFILE_PHOTO_MAX_BYTES = 6_000_000;

const supportedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export function decodeProfilePhotoDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/);
  if (!match || !supportedTypes.has(match[1])) return null;
  const contentType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > PROFILE_PHOTO_MAX_BYTES) return null;
  return { contentType, extension: contentType.split("/")[1], buffer };
}
