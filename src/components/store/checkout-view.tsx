"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatMAD } from "@/lib/money";
import type { CartDTO } from "@/services/cart";
import type { DeliveryZoneDTO, DeliveryQuote } from "@/services/delivery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Banknote, CreditCard, Loader2, ShieldCheck } from "lucide-react";

interface Props {
  cart: CartDTO;
  zones: DeliveryZoneDTO[];
  codEnabled: boolean;
  cardEnabled: boolean;
  locale: string;
}

type PaymentMethod = "COD" | "CARD";

export function CheckoutView({ cart, zones, codEnabled, cardEnabled, locale }: Props) {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const tco = useTranslations("common");
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    codEnabled ? "COD" : "CARD",
  );
  const [quote, setQuote] = useState<(DeliveryQuote & { key: string }) | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const afterCoupon = useMemo(
    () => Math.max(0, cart.subtotalMinor - cart.couponDiscountMinor),
    [cart.subtotalMinor, cart.couponDiscountMinor],
  );

  const quoteKey = `${city.trim()}|${afterCoupon}`;

  useEffect(() => {
    const cityQuery = city.trim();
    if (!cityQuery) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/delivery/quote?city=${encodeURIComponent(cityQuery)}&subtotal=${afterCoupon}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as DeliveryQuote;
        if (!cancelled) setQuote({ ...data, key: `${cityQuery}|${afterCoupon}` });
      } catch {
        /* ignore */
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [city, afterCoupon]);

  const activeQuote = quote && quote.key === quoteKey ? quote : null;
  const deliveryFee = activeQuote?.feeMinor ?? 0;
  const totalMinor = afterCoupon + deliveryFee;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (fullName.trim().length < 2) errors.fullName = t("fullName");
    if (!/^(\+212|0)[\s.-]?\d([\s.-]?\d){8}$/.test(phone.trim().replace(/\s+/g, "")))
      errors.phone = t("phone");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = t("email");
    if (!city) errors.city = t("selectZone");
    if (addressLine.trim().length < 5) errors.addressLine = t("address");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          city: city.trim(),
          addressLine: addressLine.trim(),
          customerNote: customerNote.trim() || null,
          paymentMethod,
          locale,
        }),
      });
      const data = (await res.json()) as {
        orderNumber?: string;
        checkoutUrl?: string | null;
        error?: { code?: string; message?: string };
      };
      if (!res.ok) {
        const message = data.error?.message;
        if (data.error?.code === "VALIDATION_ERROR") setError(t("errors.generic"));
        else setError(message ?? t("errors.generic"));
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      router.push(`/order/${data.orderNumber}`);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        {/* Contact */}
        <section className="rounded-xl border bg-card p-5 shadow-xs">
          <h2 className="mb-4 text-lg font-semibold text-navy-950">{t("stepContact")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fullName")} error={fieldErrors.fullName}>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </Field>
            <Field label={t("phone")} error={fieldErrors.phone}>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label={`${t("email")} · ${tco("optional")}`} error={fieldErrors.email}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </Field>
            </div>
          </div>
        </section>

        {/* Delivery */}
        <section className="rounded-xl border bg-card p-5 shadow-xs">
          <h2 className="mb-4 text-lg font-semibold text-navy-950">{t("stepDelivery")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("deliveryZone")} error={fieldErrors.city}>
              <Input
                list="aras-cities"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("selectZone")}
                autoComplete="address-level2"
                required
              />
              <datalist id="aras-cities">
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.city}>
                    {zone.city} — {zone.feeMinor === 0 ? tc("shippingFree") : formatMAD(zone.feeMinor)}
                  </option>
                ))}
              </datalist>
            </Field>
            <div className="sm:col-span-2">
              <Field label={t("address")} error={fieldErrors.addressLine}>
                <Textarea
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  rows={2}
                  autoComplete="street-address"
                  required
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label={t("customerNote")}>
                <Textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-xl border bg-card p-5 shadow-xs">
          <h2 className="mb-4 text-lg font-semibold text-navy-950">{t("stepPayment")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <PaymentOption
              active={paymentMethod === "COD"}
              disabled={!codEnabled}
              onClick={() => setPaymentMethod("COD")}
              icon={<Banknote className="size-5" />}
              title={t("cod")}
              desc={t("codDesc")}
            />
            <PaymentOption
              active={paymentMethod === "CARD"}
              disabled={!cardEnabled}
              onClick={() => setPaymentMethod("CARD")}
              icon={<CreditCard className="size-5" />}
              title={t("card")}
              desc={cardEnabled ? t("cardDesc") : t("cardUnavailable")}
            />
          </div>
        </section>

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-xl border bg-card p-5 shadow-xs lg:sticky lg:top-56">
        <h2 className="text-lg font-semibold text-navy-950">{t("orderSummary")}</h2>

        <ul className="mt-4 space-y-3 border-b pb-4">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 text-sm">
              <span className="relative block size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="size-full object-cover" />
                )}
                <span className="absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full bg-navy-950 text-[10px] font-bold text-white">
                  {item.quantity}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
              <span className="shrink-0 font-medium">{formatMAD(item.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{tc("subtotal")}</dt>
            <dd>{formatMAD(cart.subtotalMinor)}</dd>
          </div>
          {cart.couponDiscountMinor > 0 && (
            <div className="flex justify-between text-success">
              <dt>{tc("coupon")}</dt>
              <dd>-{formatMAD(cart.couponDiscountMinor)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{tc("shipping")}</dt>
            <dd>
              {activeQuote
                ? activeQuote.feeMinor === 0
                  ? tc("shippingFree")
                  : formatMAD(activeQuote.feeMinor)
                : city
                  ? "…"
                  : tc("shippingCalculated")}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <dt>{tc("totalToPay")}</dt>
            <dd className="text-navy-950">{formatMAD(totalMinor)}</dd>
          </div>
        </dl>

        <Button
          type="submit"
          size="lg"
          className="mt-5 w-full rounded-full bg-gold-500 text-navy-950 hover:bg-gold-400"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {t("placing")}
            </>
          ) : (
            t("placeOrder")
          )}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" /> {tc("checkoutSecure")}
        </p>
      </aside>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function PaymentOption({
  active,
  disabled,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-start gap-3 rounded-lg border p-4 text-start transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? "border-navy-950 bg-accent ring-1 ring-navy-950" : "border-border hover:border-foreground/40"
      }`}
    >
      <span className={active ? "text-gold-600" : "text-muted-foreground"}>{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-navy-950">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}
