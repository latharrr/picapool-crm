import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";

// TODO(milestone-3): replace with real session + workspace membership lookup
// once NextAuth + the root spreadsheet repositories are wired up.
async function getCurrentUserAndWorkspaces() {
  return {
    user: null as null | { name: string; email: string; role: string },
    workspaces: [] as { id: string; name: string }[],
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, workspaces } = await getCurrentUserAndWorkspaces();

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
      <div className="flex min-h-svh flex-1 flex-col">
        <Topbar user={user} workspaces={workspaces} />
        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:pb-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
