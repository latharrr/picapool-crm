"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function CreateWorkspaceDialog({
  serviceAccountEmail,
}: {
  serviceAccountEmail?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const adminEmailsRaw = String(formData.get("admin_emails") ?? "");

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        admin_emails: adminEmailsRaw
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean),
        existing_spreadsheet: formData.get("existing_spreadsheet") || undefined,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to create workspace");
      return;
    }

    toast.success("Workspace provisioned");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> New Workspace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="e.g. Delhi Housing" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin_emails">Admin emails (view-only access, comma separated)</Label>
            <Input id="admin_emails" name="admin_emails" placeholder="founder@picapool.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="existing_spreadsheet">
              Existing spreadsheet URL <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="existing_spreadsheet"
              name="existing_spreadsheet"
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to let the app create a new spreadsheet. If your service account can&apos;t
              create files (common without Google Workspace), create a blank sheet yourself, share it
              with{" "}
              {serviceAccountEmail ? (
                <span className="font-mono text-foreground">{serviceAccountEmail}</span>
              ) : (
                "your service account"
              )}{" "}
              as Editor, and paste its URL here — the app will add the required tabs to it.
            </p>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Provisioning..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
