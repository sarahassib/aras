"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const t = useTranslations("common");
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
      {t("signOut")}
    </Button>
  );
}
