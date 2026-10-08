import type { StorageProvider, UploadInput, UploadedFile } from "./types";

/**
 * Cloudinary unsigned upload (production). Requires env:
 *   CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
 * (or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET)
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME);
}

function parseCloudinaryUrl(): { cloud: string; key: string; secret: string } | null {
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const cloud = url.hostname;
    const key = decodeURIComponent(url.username);
    const secret = decodeURIComponent(url.password);
    if (cloud && key && secret) return { cloud, key, secret };
  } catch {
    return null;
  }
  return null;
}

function credentials(): { cloud: string; key: string; secret: string } {
  const parsed = parseCloudinaryUrl();
  if (parsed) return parsed;

  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (cloud && key && secret) return { cloud, key, secret };

  throw new Error("Cloudinary is not configured (missing CLOUDINARY_URL)");
}

function timestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export function createCloudinaryStorage(): StorageProvider {
  return {
    name: "cloudinary",
    async upload(input: UploadInput): Promise<UploadedFile> {
      const { cloud, key, secret } = credentials();
      const ts = timestamp();
      const folder = "aras/products";

      // Signature: sha1(folder=…&timestamp=…+api_secret) — Cloudinary legacy scheme.
      const { createHash } = await import("node:crypto");
      const toSign = `folder=${folder}&timestamp=${ts}${secret}`;
      const signature = createHash("sha1").update(toSign).digest("hex");

      const form = new FormData();
      form.set("api_key", key);
      form.set("timestamp", String(ts));
      form.set("folder", folder);
      form.set("signature", signature);
      form.set(
        "file",
        new Blob([new Uint8Array(input.data)], { type: input.contentType }),
        input.filename,
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
        { method: "POST", body: form },
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Cloudinary upload failed (${response.status}): ${detail.slice(0, 300)}`);
      }

      const json = (await response.json()) as { secure_url?: string };
      if (!json.secure_url) throw new Error("Cloudinary upload returned no URL");
      return { url: json.secure_url };
    },
    async remove(url: string): Promise<void> {
      if (!url.includes("res.cloudinary.com")) return;
      const { cloud, key, secret } = credentials();
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
      if (!match) return;

      const publicId = match[1];
      const ts = timestamp();
      const toSign = `public_id=${publicId}&timestamp=${ts}${secret}`;
      const { createHash } = await import("node:crypto");
      const signature = createHash("sha1").update(toSign).digest("hex");

      const form = new FormData();
      form.set("api_key", key);
      form.set("timestamp", String(ts));
      form.set("public_id", publicId);
      form.set("signature", signature);

      await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
        method: "POST",
        body: form,
      }).catch(() => undefined);
    },
  };
}
