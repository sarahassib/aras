import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { NotFoundError } from "@/lib/errors";
import { errorResponse } from "@/lib/api";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/**
 * Serves locally-stored uploads (.data/uploads). Path traversal is blocked
 * by resolving against the root and rejecting anything outside it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await params;
    if (!segments?.length) throw new NotFoundError("File not found");

    const root = path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "uploads");
    const relative = segments.join("/");
    const resolved = path.resolve(root, relative);

    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      throw new NotFoundError("File not found");
    }

    const info = await stat(resolved);
    if (!info.isFile()) throw new NotFoundError("File not found");

    const data = await readFile(resolved);
    const contentType = MIME[path.extname(resolved).toLowerCase()] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(data.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
