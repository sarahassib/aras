import type { Metadata } from "next";
import { getRawSettings } from "@/services/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getRawSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-950">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Store identity, payments, delivery and content shown to customers.
        </p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
