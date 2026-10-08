import type { EmailProvider } from "../types";

/**
 * Development provider — prints the e-mail to the server console.
 * Nothing is sent anywhere, which keeps local work and CI safe.
 */
export const consoleEmailProvider: EmailProvider = {
  name: "console",
  async send(email) {
    console.log(
      [
        "",
        "────────────── ARAS EMAIL (console provider) ──────────────",
        `To:      ${email.toName ? `${email.toName} <${email.to}>` : email.to}`,
        `Subject: ${email.subject}`,
        "────────────────────────────────────────────────────────────",
        email.text ?? email.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        "────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
  },
};
