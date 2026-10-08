import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { DEFAULT_LOCALE } from "@/lib/business-rules";
import { getEmailProvider } from "./provider";
import { renderTemplate, type EmailPayload, type EmailTemplate } from "./templates";

const MAX_ATTEMPTS = 5;

export interface EnqueueEmailInput {
  to: string;
  toName?: string;
  template: EmailTemplate;
  locale?: string;
  payload: EmailPayload;
}

/**
 * Adds an e-mail to the durable outbox. Checkout and other critical flows
 * only ever call this — sending happens asynchronously (see processOutbox).
 */
export async function enqueueEmail(input: EnqueueEmailInput): Promise<void> {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const rendered = renderTemplate(input.template, locale, input.payload);

  await db.emailOutbox.create({
    data: {
      toEmail: input.to,
      toName: input.toName ?? null,
      subject: rendered.subject,
      template: input.template,
      locale,
      payload: {
        html: rendered.html,
        text: rendered.text,
        ...input.payload,
      } as unknown as Prisma.InputJsonValue,
      status: "PENDING",
    },
  });

  if (process.env.NODE_ENV !== "test" && process.env.EMAIL_WORKER !== "0") {
    setTimeout(() => {
      void processOutbox().catch((error) => {
        console.error("[email] outbox flush failed:", error);
      });
    }, 50);
  }
}

export async function enqueuePasswordResetEmail(
  email: string,
  name: string,
  url: string,
): Promise<void> {
  await enqueueEmail({
    to: email,
    toName: name,
    template: "password_reset",
    locale: DEFAULT_LOCALE,
    payload: { url, name },
  });
}

export async function enqueueWelcomeEmail(
  email: string,
  name: string,
  locale: string = DEFAULT_LOCALE,
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  await enqueueEmail({
    to: email,
    toName: name,
    template: "welcome",
    locale,
    payload: { name, appUrl: `${appUrl}/${locale}` },
  });
}

let processing = false;

export async function processOutbox(
  limit = 10,
): Promise<{ sent: number; failed: number }> {
  if (processing) return { sent: 0, failed: 0 };
  processing = true;

  try {
    const rows = await db.emailOutbox.findMany({
      where: { status: "PENDING", attempts: { lt: MAX_ATTEMPTS } },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    if (rows.length === 0) return { sent: 0, failed: 0 };

    const provider = getEmailProvider();
    let sent = 0;
    let failed = 0;

    for (const row of rows) {
      const data = row.payload as { html?: string; text?: string };
      try {
        await provider.send({
          to: row.toEmail,
          toName: row.toName ?? undefined,
          subject: row.subject,
          html: data.html ?? "",
          text: data.text,
        });

        await db.emailOutbox.update({
          where: { id: row.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            attempts: row.attempts + 1,
            lastError: null,
          },
        });
        sent += 1;
      } catch (error) {
        const attempts = row.attempts + 1;
        const message = error instanceof Error ? error.message : "Unknown error";
        await db.emailOutbox.update({
          where: { id: row.id },
          data: {
            attempts,
            lastError: message.slice(0, 500),
            status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
          },
        });
        failed += 1;
        console.error(`[email] failed to send "${row.template}" to ${row.toEmail}:`, message);
      }
    }

    return { sent, failed };
  } finally {
    processing = false;
  }
}
