import {
  fill,
  getOrderEmailCopy,
  getStaticEmailCopy,
  toEmailLocale,
} from "./copy";
import { renderEmail, toPlainText } from "./render";

export type OrderEmailTemplate =
  | "order_created"
  | "order_confirmed"
  | "order_preparing"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled";

export type EmailTemplate =
  | OrderEmailTemplate
  | "password_reset"
  | "welcome"
  | "generic";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface EmailPayload {
  [key: string]: unknown;
}

const ORDER_TEMPLATE_STATUS: Record<OrderEmailTemplate, string> = {
  order_created: "NEW",
  order_confirmed: "CONFIRMED",
  order_preparing: "PREPARING",
  order_shipped: "SHIPPED",
  order_delivered: "DELIVERED",
  order_cancelled: "CANCELLED",
};

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function renderTemplate(
  template: EmailTemplate,
  locale: string | undefined,
  payload: EmailPayload,
): RenderedEmail {
  const lang = toEmailLocale(locale);

  if (template.startsWith("order_")) {
    const copy = getOrderEmailCopy(lang, template);
    const vars = {
      orderNumber: str(payload.orderNumber, "—"),
      customerName: str(payload.customerName),
      total: str(payload.total),
    };

    const paragraphs = [fill(copy.body, vars)];
    if (vars.total) paragraphs.push(`Total : ${vars.total}`);

    const ctaUrl = str(payload.trackingUrl) || str(payload.appUrl);

    const input = {
      locale: lang,
      preheader: fill(copy.subject, vars),
      heading: copy.heading,
      paragraphs,
      ctaLabel: copy.cta,
      ctaUrl: ctaUrl || undefined,
      footerNote: str(payload.footerNote) || undefined,
    };

    return {
      subject: fill(copy.subject, vars),
      html: renderEmail(input),
      text: toPlainText(input),
    };
  }

  if (template === "password_reset") {
    const copy = getStaticEmailCopy(lang, "password_reset");
    const name = str(payload.name);
    const url = str(payload.url);
    const paragraphs = [copy.body];

    const input = {
      locale: lang,
      preheader: copy.subject,
      heading: name ? `${copy.heading}` : copy.heading,
      paragraphs: name ? [`Bonjour ${name},`, ...paragraphs] : paragraphs,
      ctaLabel: copy.cta,
      ctaUrl: url || undefined,
    };

    return {
      subject: copy.subject,
      html: renderEmail(input),
      text: toPlainText(input),
    };
  }

  if (template === "welcome") {
    const copy = getStaticEmailCopy(lang, "welcome");
    const name = str(payload.name);

    const input = {
      locale: lang,
      preheader: copy.subject,
      heading: copy.heading,
      paragraphs: name
        ? [`Bonjour ${name},`, copy.body]
        : [copy.body],
      ctaLabel: copy.cta,
      ctaUrl: str(payload.appUrl) || undefined,
    };

    return {
      subject: copy.subject,
      html: renderEmail(input),
      text: toPlainText(input),
    };
  }

  const subject = str(payload.subject, "ARAS");
  const input = {
    locale: lang,
    preheader: subject,
    heading: str(payload.heading, subject),
    paragraphs: [str(payload.body)],
    ctaLabel: str(payload.ctaLabel) || undefined,
    ctaUrl: str(payload.ctaUrl) || undefined,
  };

  return {
    subject,
    html: renderEmail(input),
    text: toPlainText(input),
  };
}

export function statusToTemplate(status: string): OrderEmailTemplate {
  switch (status) {
    case "NEW":
      return "order_created";
    case "CONFIRMED":
      return "order_confirmed";
    case "PREPARING":
      return "order_preparing";
    case "SHIPPED":
      return "order_shipped";
    case "DELIVERED":
      return "order_delivered";
    case "CANCELLED":
      return "order_cancelled";
    default:
      return "order_created";
  }
}

export function templateToStatus(template: OrderEmailTemplate): string {
  return ORDER_TEMPLATE_STATUS[template];
}
