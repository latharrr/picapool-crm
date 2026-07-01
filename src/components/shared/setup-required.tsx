import { AlertTriangle } from "lucide-react";

export function SetupRequired({
  missing,
}: {
  /** Env var names (or short labels) that are missing. */
  missing: string[];
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-warning/40 bg-warning/5 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
        <AlertTriangle className="h-6 w-6 text-warning" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">Setup required</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        This screen needs a Google service account and workspace spreadsheet to load real data.
        Configure the following and redeploy:
      </p>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {missing.map((item) => (
          <li
            key={item}
            className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        See <span className="font-mono">docs/SETUP.md</span> for step-by-step instructions.
      </p>
    </div>
  );
}
