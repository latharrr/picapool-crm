"use client";

import { MessageSquare, Mail } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import type { MessageHistoryRecord, EmailHistoryRecord } from "@/lib/sheets/schema/engagement";

export function WhatsappMessagesTable({
  messages,
  leadNames,
}: {
  messages: MessageHistoryRecord[];
  leadNames: Record<string, string>;
}) {
  return (
    <DataTable<MessageHistoryRecord>
      items={messages}
      emptyIcon={MessageSquare}
      emptyTitle="No WhatsApp messages logged"
      emptyDescription="WhatsApp Cloud API isn't connected yet. Messages sent manually can still be logged here for history."
      columns={[
        { header: "Lead", render: (m) => leadNames[m.lead_id] ?? m.lead_id },
        { header: "Direction", render: (m) => <span className="capitalize">{m.direction}</span> },
        { header: "Message", render: (m) => <span className="line-clamp-1">{m.body}</span> },
        { header: "Sent", render: (m) => new Date(m.sent_at).toLocaleString() },
      ]}
    />
  );
}

export function EmailMessagesTable({
  emails,
  leadNames,
}: {
  emails: EmailHistoryRecord[];
  leadNames: Record<string, string>;
}) {
  return (
    <DataTable<EmailHistoryRecord>
      items={emails}
      emptyIcon={Mail}
      emptyTitle="No emails logged"
      emptyDescription="An email provider (e.g. Resend/SendGrid) isn't connected yet. Emails sent manually can still be logged here for history."
      columns={[
        { header: "Lead", render: (e) => leadNames[e.lead_id] ?? e.lead_id },
        { header: "Subject", render: (e) => e.subject },
        { header: "Direction", render: (e) => <span className="capitalize">{e.direction}</span> },
        { header: "Sent", render: (e) => new Date(e.sent_at).toLocaleString() },
      ]}
    />
  );
}
