export interface UploadInput {
  filename: string;
  contentType: string;
  data: Buffer;
}

export interface UploadedFile {
  /** Public URL path (local) or absolute URL (cloud). */
  url: string;
}

export interface StorageProvider {
  name: "local" | "cloudinary";
  upload(input: UploadInput): Promise<UploadedFile>;
  /** Best-effort cleanup; local provider keeps files referenced by the DB. */
  remove(url: string): Promise<void>;
}
