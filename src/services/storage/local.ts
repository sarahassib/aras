import { createHash } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, UploadInput, UploadedFile } from "./types";

/**
 * Local disk storage (dev default). Files land in .data/uploads and are
 * served by /api/files/[...path] with strict path traversal protection.
 */
export function createLocalStorage(baseDir?: string): StorageProvider {
  const root =
    baseDir ?? path.join(process.cwd(), ".data", "uploads");

  return {
    name: "local",
    async upload(input: UploadInput): Promise<UploadedFile> {
      const now = new Date();
      const folder = path.join(
        String(now.getFullYear()),
        String(now.getMonth() + 1).padStart(2, "0"),
      );
      const hash = createHash("sha256")
        .update(input.data)
        .digest("hex")
        .slice(0, 12);
      const safeName = input.filename
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .slice(-60) || "file";

      const dir = path.join(root, folder);
      await mkdir(dir, { recursive: true });

      const filePath = path.join(dir, `${hash}-${safeName}`);
      await writeFile(filePath, input.data);

      return { url: `/api/files/${folder}/${hash}-${safeName}`.replace(/\\/g, "/") };
    },
    async remove(url: string): Promise<void> {
      if (!url.startsWith("/api/files/")) return;
      const relative = url.slice("/api/files/".length);
      const filePath = path.join(root, relative);
      if (!filePath.startsWith(root)) return;
      await unlink(filePath).catch(() => undefined);
    },
  };
}
