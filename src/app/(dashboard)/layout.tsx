import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";
import { requireSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { getActiveWorkspaceId, setActiveWorkspaceAction } from "@/lib/workspace";
import { resolveWorkspaceContext } from "@/lib/workspace-context";
import { getFeatureFlags } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const activeWorkspaceId = (await getActiveWorkspaceId()) ?? session.user.workspaces[0]?.id;
  const ctx = await resolveWorkspaceContext(session, activeWorkspaceId);
  const enabledFeatures = ctx ? await getFeatureFlags(ctx.spreadsheetId) : null;

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar role={session.user.role} enabledFeatures={enabledFeatures} />
      <div className="flex min-h-svh flex-1 flex-col">
        <Topbar
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
          workspaces={session.user.workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelectWorkspace={setActiveWorkspaceAction}
          onSignOut={logoutAction}
          role={session.user.role}
          enabledFeatures={enabledFeatures}
        />
        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:pb-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <MobileNav role={session.user.role} enabledFeatures={enabledFeatures} />
    </div>
  );
}
