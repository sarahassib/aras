"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function TrackForm({ placeholder, cta }: { placeholder: string; cta: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const number = value.trim().toUpperCase();
    if (!number) return;
    router.push(`/order/${encodeURIComponent(number)}`);
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-center"
        aria-label={placeholder}
      />
      <Button type="submit" className="rounded-full bg-navy-950 px-5 text-white hover:bg-navy-800">
        <Search className="size-4" /> {cta}
      </Button>
    </form>
  );
}
