import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const uploadRoot = path.resolve(process.cwd(), "client/public/uploads");

function normalizeKey(relKey: string) {
  return relKey.replace(/^\/+/, "").replace(/\.\./g, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const normalized = normalizeKey(relKey);
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "bin";
  const key = normalized.includes(".") ? normalized : normalized + "_" + crypto.randomUUID() + "." + ext;
  const target = path.resolve(uploadRoot, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
  return { key, url: "/uploads/" + key };
}

export async function storageGet(relKey: string) {
  const key = normalizeKey(relKey);
  return { key, url: "/uploads/" + key };
}

export async function storageGetSignedUrl(relKey: string) {
  return (await storageGet(relKey)).url;
}
