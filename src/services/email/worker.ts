import { processOutbox } from "./outbox";

let timer: ReturnType<typeof setInterval> | null = null;

/** Background worker draining the e-mail outbox. Started from instrumentation.ts. */
export function startEmailWorker(intervalMs = 15_000): void {
  if (timer || process.env.EMAIL_WORKER === "0" || process.env.NODE_ENV === "test") {
    return;
  }

  timer = setInterval(() => {
    void processOutbox().catch((error) => {
      console.error("[email-worker] run failed:", error);
    });
  }, intervalMs);

  if (typeof timer === "object" && "unref" in timer) {
    timer.unref();
  }

  console.log("[email-worker] started");
}

export function stopEmailWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
