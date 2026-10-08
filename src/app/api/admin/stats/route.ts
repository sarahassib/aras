import { apiRoute, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { getDashboardStats } from "@/services/stats";

export const runtime = "nodejs";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    const stats = await getDashboardStats();
    return ok(stats);
  });
}
