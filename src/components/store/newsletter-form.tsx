"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";

type State = "idle" | "loading" | "success" | "already" | "invalid" | "error";

export function NewsletterForm() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      if (!res.ok) {
        setState("invalid");
        return;
      }
      const data = (await res.json()) as { status?: string };
      setState(data.status === "ALREADY" ? "already" : "success");
    } catch {
      setState("error");
    }
  };

  if (state === "success" || state === "already") {
    return (
      <p className="flex items-center gap-2 text-sm text-gold-200">
        <Check className="size-4 shrink-0" />
        {state === "already" ? t("newsletterAlready") : t("newsletterSuccess")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("newsletterPlaceholder")}
          className="border-navy-700 bg-navy-900 text-white placeholder:text-navy-400"
        />
        <Button type="submit" className="shrink-0 bg-gold-500 text-navy-950 hover:bg-gold-400">
          {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : t("newsletterCta")}
        </Button>
      </div>
      {state === "invalid" && <p className="text-xs text-red-300">{t("newsletterInvalid")}</p>}
      {state === "error" && <p className="text-xs text-red-300">⚠ {t("newsletterInvalid")}</p>}
    </form>
  );
}
