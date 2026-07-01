import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogMessageDialog } from "@/components/messages/log-message-dialog";
import { LogEmailDialog } from "@/components/messages/log-email-dialog";
import { WhatsappMessagesTable, EmailMessagesTable } from "@/components/messages/messages-table";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import {
  leadsRepository,
  messageHistoryRepository,
  emailHistoryRepository,
} from "@/lib/sheets/repositories";

export const dynamic = "force-dynamic";

function NotConnectedBadge() {
  return (
    <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
      Not yet connected — logging only
    </Badge>
  );
}

export default async function MessagesPage() {
  const session = await requireSession();
  const ctx = await getActiveWorkspaceContext(session);

  if (!ctx) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messages" />
        <NoWorkspace />
      </div>
    );
  }
  if (!hasPermission(ctx.role, "VIEW")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messages" />
        <PermissionDenied />
      </div>
    );
  }

  const [leads, messages, emails] = await Promise.all([
    leadsRepository.list(ctx.spreadsheetId),
    messageHistoryRepository.list(ctx.spreadsheetId),
    emailHistoryRepository.list(ctx.spreadsheetId),
  ]);
  const leadOptions = leads.map((l) => ({ id: l.id, name: l.name, phone: l.phone }));
  const leadNameById = new Map(leads.map((l) => [l.id, l.name]));
  const leadNames = Object.fromEntries(leadNameById.entries());
  
  const canSendWhatsapp = hasPermission(ctx.role, "SEND_WHATSAPP");
  const canSendEmail = hasPermission(ctx.role, "SEND_EMAIL");

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="WhatsApp and email history logged against leads." />
      <Tabs defaultValue="whatsapp">
        <TabsList>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>
        <TabsContent value="whatsapp" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <NotConnectedBadge />
            {canSendWhatsapp && <LogMessageDialog workspaceId={ctx.workspaceId} leads={leadOptions} />}
          </div>
          <WhatsappMessagesTable messages={messages} leadNames={leadNames} />
        </TabsContent>
        <TabsContent value="email" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <NotConnectedBadge />
            {canSendEmail && <LogEmailDialog workspaceId={ctx.workspaceId} leads={leadOptions} />}
          </div>
          <EmailMessagesTable emails={emails} leadNames={leadNames} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
