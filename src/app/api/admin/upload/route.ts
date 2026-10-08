import type { NextRequest } from "next/server";
import { apiRoute, created, enforceRateLimit } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { ValidationError } from "@/lib/errors";
import { uploadImage } from "@/services/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    enforceRateLimit(request, "admin:upload", 60, 60_000);

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");

    if (!(file instanceof File)) {
      throw new ValidationError("No file uploaded", [
        { path: "file", message: "Attach a file under the 'file' field" },
      ]);
    }

    const data = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImage({
      filename: file.name || "upload",
      contentType: file.type || "application/octet-stream",
      data,
    });

    return created({ url: uploaded.url });
  });
}
