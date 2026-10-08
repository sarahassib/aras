import type { EmailProvider } from "../types";

/**
 * Resend provider (https://resend.com) — plain HTTPS API, no SDK required.
 * Configure: EMAIL_PROVIDER=resend + RESEND_API_KEY.
 */
export function createResendProvider(options: {
  apiKey: string;
  from: string;
}): EmailProvider {
  return {
    name: "resend",
    async send(email) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: options.from,
          to: [email.to],
          subject: email.subject,
          html: email.html,
          text: email.text,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Resend API error ${response.status}: ${detail}`);
      }
    },
  };
}
