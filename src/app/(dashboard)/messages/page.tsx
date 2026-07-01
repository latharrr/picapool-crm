import { MessageSquare, Mail } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { NoWorkspace } from "@/components/shared/no-workspace";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogMessageDialog } from "@/components/messages/log-message-dialog";
import { LogEmailDialog } from "@/components/messages/log-email-dialog";
import { requireSession } from "@/lib/auth/session";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { hasPermission } from "@/lib/auth/rbac";
import {
  leadsRepository,
  messageHistoryRepository,
  emailHistoryRepository,
} from "@/lib/sheets/repositories";
import type { MessageHistoryRecord, EmailHistoryRecord } from "@/lib/sheets/schema/engagement";

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
          <DataTable<MessageHistoryRecord>
            items={messages}
            emptyIcon={MessageSquare}
            emptyTitle="No WhatsApp messages logged"
            emptyDescription="WhatsApp Cloud API isn't connected yet. Messages sent manually can still be logged here for history."
            columns={[
              { header: "Lead", render: (m) => leadNameById.get(m.lead_id) ?? m.lead_id },
              { header: "Direction", render: (m) => <span className="capitalize">{m.direction}</span> },
              { header: "Message", render: (m) => <span className="line-clamp-1">{m.body}</span> },
              { header: "Sent", render: (m) => new Date(m.sent_at).toLocaleString() },
            ]}
          />
        </TabsContent>
        <TabsContent value="email" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <NotConnectedBadge />
            {canSendEmail && <LogEmailDialog workspaceId={ctx.workspaceId} leads={leadOptions} />}
          </div>
          <DataTable<EmailHistoryRecord>
            items={emails}
            emptyIcon={Mail}
            emptyTitle="No emails logged"
            emptyDescription="An email provider (e.g. Resend/SendGrid) isn't connected yet. Emails sent manually can still be logged here for history."
            columns={[
              { header: "Lead", render: (e) => leadNameById.get(e.lead_id) ?? e.lead_id },
              { header: "Subject", render: (e) => e.subject },
              { header: "Direction", render: (e) => <span className="capitalize">{e.direction}</span> },
              { header: "Sent", render: (e) => new Date(e.sent_at).toLocaleString() },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
