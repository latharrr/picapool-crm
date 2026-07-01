import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";
import { requireSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { getActiveWorkspaceId, setActiveWorkspaceAction } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const activeWorkspaceId = (await getActiveWorkspaceId()) ?? session.user.workspaces[0]?.id;

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
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
        />
        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:pb-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
