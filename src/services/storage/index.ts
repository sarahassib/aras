import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/business-rules";
import { ValidationError } from "@/lib/errors";
import type { StorageProvider, UploadInput, UploadedFile } from "./types";
import { createLocalStorage } from "./local";
import { createCloudinaryStorage, isCloudinaryConfigured } from "./cloudinary";

let cached: StorageProvider | null = null;

/** STORAGE_PROVIDER=cloudinary|local (cloudinary only when configured). */
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  const preferCloud =
    (process.env.STORAGE_PROVIDER ?? "local") === "cloudinary" && isCloudinaryConfigured();

  cached = preferCloud ? createCloudinaryStorage() : createLocalStorage();
  return cached;
}

export function validateImageUpload(input: {
  filename: string;
  contentType: string;
  data: Buffer;
}): UploadInput {
  if (!ALLOWED_IMAGE_TYPES.includes(input.contentType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new ValidationError(`Unsupported file type "${input.contentType}"`, [
      { path: "file", message: "Only JPEG, PNG, WebP, AVIF or SVG images are allowed" },
    ]);
  }
  if (input.data.byteLength === 0) {
    throw new ValidationError("Empty file", [{ path: "file", message: "File is empty" }]);
  }
  if (input.data.byteLength > MAX_UPLOAD_BYTES) {
    throw new ValidationError("File too large", [
      { path: "file", message: `Max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB` },
    ]);
  }
  return {
    filename: input.filename || "upload",
    contentType: input.contentType,
    data: input.data,
  };
}

export async function uploadImage(input: {
  filename: string;
  contentType: string;
  data: Buffer;
}): Promise<UploadedFile> {
  const validated = validateImageUpload(input);
  return getStorageProvider().upload(validated);
}

export type { StorageProvider, UploadedFile };
