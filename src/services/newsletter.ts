import { db } from "@/lib/db";
import { enqueueEmail } from "./email/outbox";

export type SubscribeResult = "OK" | "ALREADY" | "INVALID";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribeNewsletter(
  email: string,
  source = "footer",
): Promise<SubscribeResult> {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) return "INVALID";

  const existing = await db.newsletterSubscriber.findUnique({ where: { email: normalized } });
  if (existing) {
    if (!existing.active) {
      await db.newsletterSubscriber.update({
        where: { email: normalized },
        data: { active: true, subscribedAt: new Date(), source },
      });
      return "OK";
    }
    return "ALREADY";
  }

  await db.newsletterSubscriber.create({
    data: { email: normalized, source, active: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  await enqueueEmail({
    to: normalized,
    template: "welcome",
    locale: "fr",
    payload: { name: "", appUrl: `${appUrl}/fr` },
  }).catch((error) => console.error("[newsletter] welcome email failed:", error));

  return "OK";
}

export async function listSubscribers(page = 1, perPage = 50, activeOnly = false) {
  const where = activeOnly ? { active: true } : {};
  const [total, subscribers] = await Promise.all([
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribedAt: "desc" },
      skip: (Math.max(1, page) - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { items: subscribers, total, page, pages: Math.ceil(total / perPage) };
}

export async function setSubscriberActive(id: string, active: boolean): Promise<void> {
  await db.newsletterSubscriber.update({ where: { id }, data: { active } });
}

export async function deleteSubscriber(id: string): Promise<void> {
  await db.newsletterSubscriber.delete({ where: { id } });
}
