"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { TaskRecord } from "@/lib/sheets/schema/engagement";

export function TaskStatusSelect({
  task,
  workspaceId,
}: {
  task: TaskRecord;
  workspaceId: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleChange(status: string) {
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, id: task.id, status }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to update task");
      return;
    }
    router.refresh();
  }

  return (
    <Select value={task.status} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger
        onClick={(e) => e.stopPropagation()}
        className="h-7 w-32 text-xs"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        <SelectItem value="open">Open</SelectItem>
        <SelectItem value="in_progress">In progress</SelectItem>
        <SelectItem value="done">Done</SelectItem>
      </SelectContent>
    </Select>
  );
}
