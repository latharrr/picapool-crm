import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationRecord } from "@/lib/sheets/schema/ops";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export function useNotifications(workspaceId: string, initialData?: NotificationRecord[]) {
  return useQuery({
    queryKey: ["notifications", workspaceId],
    queryFn: () =>
      fetchJSON<{ notifications: NotificationRecord[] }>(
        `/api/notifications?workspaceId=${workspaceId}`
      ).then((d) => d.notifications),
    initialData,
    refetchInterval: 20_000,
  });
}

export function useMarkNotificationRead(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] });
    },
  });
}
