"use client";

import { Phone } from "lucide-react";
import { toast } from "sonner";

/** Tap a phone number to copy it and open the device dialer in one action. */
export function PhoneTapAction({ phone }: { phone: string }) {
  async function handleClick() {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success("Number copied");
    } catch {
      // Clipboard API can be unavailable (e.g. non-HTTPS) — still open the dialer.
    }
  }

  return (
    <a
      href={`tel:${phone}`}
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <Phone className="h-3.5 w-3.5" />
      {phone}
    </a>
  );
}
