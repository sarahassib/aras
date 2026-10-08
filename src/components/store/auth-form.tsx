"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res.data?.user) router.replace("/account");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register" && password.length < 8) {
      setError(t("weakPassword"));
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === "login"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name });

      if (result.error) {
        const code = result.error.code ?? "";
        if (mode === "register" && /already|exist/i.test(result.error.message ?? "")) {
          setError(t("emailExists"));
        } else if (/password/i.test(code) || /password/i.test(result.error.message ?? "")) {
          setError(t("weakPassword"));
        } else {
          setError(t("invalidCredentials"));
        }
        return;
      }
      router.replace(mode === "login" ? "/account" : "/");
      router.refresh();
    } catch {
      setError(tc("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && (
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            minLength={2}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
        />
        {mode === "register" && (
          <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={busy}
        className="w-full rounded-full bg-navy-950 text-white hover:bg-navy-800"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : mode === "login" ? t("loginCta") : t("registerCta")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
        <Link
          href={mode === "login" ? "/auth/register" : "/auth/login"}
          className="font-semibold text-gold-600 hover:underline"
        >
          {mode === "login" ? t("registerCta") : t("loginCta")}
        </Link>
      </p>
    </form>
  );
}
