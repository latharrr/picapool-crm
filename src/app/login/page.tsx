import { getEnvStatus } from "@/lib/env";
import { LoginForm } from "@/components/auth/login-form";
import { SetupRequired } from "@/components/shared/setup-required";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const env = getEnvStatus();
  const canAuthenticate = env.googleServiceAccount && env.rootSpreadsheet && env.authSecret;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            P
          </div>
          <h1 className="text-lg font-semibold text-foreground">Sign in to Picapool CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">Internal operations platform</p>
        </div>

        {canAuthenticate ? (
          <LoginForm />
        ) : (
          <SetupRequired missing={env.missing} />
        )}
      </div>
    </div>
  );
}
