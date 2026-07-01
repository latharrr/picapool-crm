"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { FeatureKey } from "@/lib/nav-config";

export function FeatureFlagToggle({
  workspaceId,
  feature,
  enabled,
}: {
  workspaceId: string;
  feature: FeatureKey;
  enabled: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [saving, setSaving] = useState(false);

  async function handleChange(value: boolean) {
    setChecked(value);
    setSaving(true);
    const res = await fetch("/api/settings/feature-flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, feature, enabled: value }),
    });
    setSaving(false);
    if (!res.ok) {
      setChecked(!value);
      toast.error("Failed to update setting");
      return;
    }
    router.refresh();
  }

  return <Switch checked={checked} onCheckedChange={handleChange} disabled={saving} />;
}
