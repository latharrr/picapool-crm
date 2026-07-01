"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-danger/30 bg-danger/5 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle className="h-6 w-6 text-danger" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <Button size="sm" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
