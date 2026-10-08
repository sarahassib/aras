"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, User } from "lucide-react";

interface SessionUser {
  name?: string | null;
  email?: string | null;
  role?: string;
}

export function UserMenu() {
  const t = useTranslations("common");
  const tacct = useTranslations("account");
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authClient
      .getSession()
      .then((res) => {
        if (cancelled) return;
        const session = (res.data?.user ?? null) as SessionUser | null;
        setUser(session);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Button variant="ghost" size="icon" aria-hidden>
        <Loader2 className="size-4 animate-spin opacity-40" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button variant="ghost" size="icon" asChild aria-label={t("signIn")}>
        <Link href="/auth/login">
          <User className="size-5" />
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("account")}>
          <User className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">
          {t("welcome", { name: user.name ?? user.email ?? "" })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">{t("account")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders">{tacct("orders")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await authClient.signOut();
            setUser(null);
            router.push("/");
          }}
          className="text-destructive focus:text-destructive"
        >
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
