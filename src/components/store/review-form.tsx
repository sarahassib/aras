"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "auth" | "error";

export function ReviewForm({ productId }: { productId: string }) {
  const t = useTranslations("product");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title: title || null, comment: comment || null }),
      });
      if (res.status === 401 || res.status === 403) {
        setStatus("auth");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return <p className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">{t("reviewSuccess")}</p>;
  }

  if (status === "auth") {
    return (
      <p className="text-sm text-muted-foreground">
        {t("reviewLoginRequired")}{" "}
        <Link href="/auth/login" className="font-semibold text-gold-600 hover:underline">
          →
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm font-medium">{t("reviewRating")}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value}/5`}
              className="p-0.5"
            >
              <Star
                className={`size-6 transition ${
                  value <= rating ? "fill-gold-500 text-gold-500" : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("reviewTitle")}
        maxLength={120}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("reviewText")}
        rows={4}
        maxLength={2000}
      />
      <Button type="submit" disabled={status === "loading"} className="rounded-full">
        {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : t("reviewSubmit")}
      </Button>
      {status === "error" && <p className="text-sm text-destructive">⚠ {t("reviewLoginRequired")}</p>}
    </form>
  );
}
