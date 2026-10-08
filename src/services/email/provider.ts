import type { EmailProvider } from "./types";
import { consoleEmailProvider } from "./providers/console";
import { createResendProvider } from "./providers/resend";

let cached: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cached) return cached;

  const provider = process.env.EMAIL_PROVIDER ?? "console";

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      throw new Error(
        "EMAIL_PROVIDER=resend requires RESEND_API_KEY and EMAIL_FROM to be set.",
      );
    }
    cached = createResendProvider({ apiKey, from });
    return cached;
  }

  if (provider !== "console") {
    throw new Error(`Unknown EMAIL_PROVIDER "${provider}". Use "console" or "resend".`);
  }

  cached = consoleEmailProvider;
  return cached;
}
