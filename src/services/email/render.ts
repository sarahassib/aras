import { getFooterCopy, toEmailLocale } from "./copy";

const NAVY = "#1B2743";
const GOLD = "#C9A227";
const MUTED = "#5B6577";
const BORDER = "#E4E8F0";

export interface RenderEmailInput {
  locale: string;
  preheader: string;
  heading: string;
  paragraphs?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const AR_FONT_STACK = "'Segoe UI', Tahoma, Arial, sans-serif";

/** Renders a brand-consistent HTML e-mail (inline styles, no external assets). */
export function renderEmail(input: RenderEmailInput): string {
  const locale = toEmailLocale(input.locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const footer = getFooterCopy(locale);
  const align = dir === "rtl" ? "right" : "left";
  const font = dir === "rtl" ? AR_FONT_STACK : FONT_STACK;

  const paragraphs = (input.paragraphs ?? [])
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${MUTED};">${escapeHtml(p)}</p>`,
    )
    .join("");

  const button =
    input.ctaLabel && input.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:8px;background:${NAVY};">
          <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(input.ctaLabel)}</a>
        </td></tr></table>`
      : "";

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(input.preheader)}</title>
</head>
<body style="margin:0;padding:0;background:#F4F6FA;font-family:${font};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FA;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${BORDER};">
        <tr>
          <td style="background:${NAVY};padding:22px 28px;" align="${align}">
            <span style="font-size:24px;font-weight:800;letter-spacing:0.18em;color:#ffffff;">ARAS</span>
            <span style="display:block;margin-top:6px;font-size:12px;letter-spacing:0.08em;color:${GOLD};">${escapeHtml(footer.tagline)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px 8px;" align="${align}">
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;color:${NAVY};font-weight:700;">${escapeHtml(input.heading)}</h1>
            ${paragraphs}
            ${button}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 28px;border-top:1px solid ${BORDER};" align="${align}">
            <p style="margin:0;font-size:13px;color:${MUTED};">${escapeHtml(input.footerNote ?? footer.note)}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#8A93A6;">© ${new Date().getFullYear()} ARAS · Casablanca, Maroc</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function toPlainText(input: {
  heading: string;
  paragraphs?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const lines = [input.heading, "", ...(input.paragraphs ?? [])];
  if (input.ctaLabel && input.ctaUrl) {
    lines.push("", `${input.ctaLabel}: ${input.ctaUrl}`);
  }
  return lines.join("\n");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
