import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <div dir="ltr" lang="en" className="flex min-h-dvh items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gold-500 text-lg font-bold text-navy-950">
            A
          </span>
          <div className="leading-tight">
            <p className="text-lg font-bold text-white">ARAS</p>
            <p className="text-xs text-slate-400">Administrator sign in</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <Suspense fallback={null}>
            <AdminLoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-white">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
