"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/app/admin/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

type Raw = {
  storeName: string;
  logoUrl: string | null;
  contactEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  currency: string;
  freeShippingThreshold: number;
  codEnabled: boolean;
  cardEnabled: boolean;
  paymentInstructionsFr: string | null;
  paymentInstructionsAr: string | null;
  paymentInstructionsEn: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  announcementFr: string | null;
  announcementAr: string | null;
  announcementEn: string | null;
};

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-xs">
      <h2 className="mb-4 text-sm font-semibold text-navy-950">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({ initial }: { initial: Raw }) {
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Raw>(key: K, value: Raw[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    startTransition(async () => {
      const result = await saveSettingsAction({
        storeName: form.storeName,
        logoUrl: form.logoUrl || null,
        contactEmail: form.contactEmail || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        address: form.address || null,
        currency: form.currency,
        freeShippingThreshold: String(form.freeShippingThreshold / 100),
        codEnabled: form.codEnabled,
        cardEnabled: form.cardEnabled,
        paymentInstructionsFr: form.paymentInstructionsFr || null,
        paymentInstructionsAr: form.paymentInstructionsAr || null,
        paymentInstructionsEn: form.paymentInstructionsEn || null,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        facebookUrl: form.facebookUrl || null,
        instagramUrl: form.instagramUrl || null,
        tiktokUrl: form.tiktokUrl || null,
        youtubeUrl: form.youtubeUrl || null,
        announcementFr: form.announcementFr || null,
        announcementAr: form.announcementAr || null,
        announcementEn: form.announcementEn || null,
      });
      if (result.ok) toast.success("Settings saved");
      else toast.error(result.error ?? "Failed to save settings");
    });
  };

  return (
    <div className="space-y-6">
      <Section title="Store identity">
        <Field label="Store name">
          <Input value={form.storeName} onChange={(e) => set("storeName", e.target.value)} />
        </Field>
        <Field label="Logo URL" hint="Path or absolute URL to the logo image">
          <Input
            value={form.logoUrl ?? ""}
            onChange={(e) => set("logoUrl", e.target.value)}
            placeholder="/images/logo.png"
          />
        </Field>
        <Field label="Currency">
          <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} />
        </Field>
        <Field label="Address">
          <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </Field>
      </Section>

      <Section title="Contact">
        <Field label="Contact e-mail">
          <Input
            type="email"
            value={form.contactEmail ?? ""}
            onChange={(e) => set("contactEmail", e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="WhatsApp">
          <Input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} />
        </Field>
      </Section>

      <section className="rounded-xl border bg-white p-5 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold text-navy-950">Payments & delivery</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Cash on delivery</p>
              <p className="text-xs text-muted-foreground">Accept COD orders</p>
            </div>
            <Switch
              checked={form.codEnabled}
              onCheckedChange={(v) => set("codEnabled", v)}
              aria-label="Enable cash on delivery"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Card payment</p>
              <p className="text-xs text-muted-foreground">Requires a payment provider key</p>
            </div>
            <Switch
              checked={form.cardEnabled}
              onCheckedChange={(v) => set("cardEnabled", v)}
              aria-label="Enable card payment"
            />
          </div>
          <Field label="Free shipping threshold (DH)">
            <Input
              type="number"
              min={0}
              step={10}
              value={form.freeShippingThreshold / 100}
              onChange={(e) =>
                set("freeShippingThreshold", Math.round(Number(e.target.value || 0) * 100))
              }
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4">
          <Field label="Payment instructions — FR">
            <Textarea
              rows={2}
              value={form.paymentInstructionsFr ?? ""}
              onChange={(e) => set("paymentInstructionsFr", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Payment instructions — AR">
              <Textarea
                rows={2}
                dir="rtl"
                value={form.paymentInstructionsAr ?? ""}
                onChange={(e) => set("paymentInstructionsAr", e.target.value)}
              />
            </Field>
            <Field label="Payment instructions — EN">
              <Textarea
                rows={2}
                value={form.paymentInstructionsEn ?? ""}
                onChange={(e) => set("paymentInstructionsEn", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-xs">
        <h2 className="mb-1 text-sm font-semibold text-navy-950">Announcement bar</h2>
        <p className="mb-4 text-xs text-muted-foreground">Shown above the storefront header</p>
        <div className="grid gap-4">
          <Field label="FR">
            <Input
              value={form.announcementFr ?? ""}
              onChange={(e) => set("announcementFr", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="AR">
              <Input
                dir="rtl"
                value={form.announcementAr ?? ""}
                onChange={(e) => set("announcementAr", e.target.value)}
              />
            </Field>
            <Field label="EN">
              <Input
                value={form.announcementEn ?? ""}
                onChange={(e) => set("announcementEn", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      <Section title="Social links">
        <Field label="Facebook">
          <Input
            value={form.facebookUrl ?? ""}
            onChange={(e) => set("facebookUrl", e.target.value)}
          />
        </Field>
        <Field label="Instagram">
          <Input
            value={form.instagramUrl ?? ""}
            onChange={(e) => set("instagramUrl", e.target.value)}
          />
        </Field>
        <Field label="TikTok">
          <Input value={form.tiktokUrl ?? ""} onChange={(e) => set("tiktokUrl", e.target.value)} />
        </Field>
        <Field label="YouTube">
          <Input
            value={form.youtubeUrl ?? ""}
            onChange={(e) => set("youtubeUrl", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="SEO">
        <Field label="Meta title">
          <Input
            value={form.metaTitle ?? ""}
            onChange={(e) => set("metaTitle", e.target.value)}
          />
        </Field>
        <Field label="Meta description">
          <Input
            value={form.metaDescription ?? ""}
            onChange={(e) => set("metaDescription", e.target.value)}
          />
        </Field>
      </Section>

      <div className="flex justify-end">
        <Button
          onClick={submit}
          disabled={pending}
          className="bg-navy-950 text-white hover:bg-navy-800"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
