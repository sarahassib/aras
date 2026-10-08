export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV === "test") return;

  const { startEmailWorker } = await import("@/services/email/worker");
  startEmailWorker();
}
