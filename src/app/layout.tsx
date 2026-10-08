import type { Metadata } from "next";
import { Cairo, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { dirFor, getCurrentLocale } from "@/i18n/locale";
import "./globals.css";

const display = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const arabic = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ARAS — Everything You Need, One Place",
    template: "%s | ARAS",
  },
  description:
    "ARAS — votre boutique en ligne au Maroc. Mode, beauté, maison, high-tech et plus encore. Livraison partout au Maroc, paiement à la livraison.",
  applicationName: "ARAS",
  keywords: ["ARAS", "e-commerce Maroc", "boutique en ligne", "Maroc", "Casablanca"],
  openGraph: {
    type: "website",
    siteName: "ARAS",
    locale: "fr_MA",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getCurrentLocale();

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${display.variable} ${body.variable} ${arabic.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background font-body text-foreground antialiased">
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
