"use client";

import { Contact } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import type { ContactRecord } from "@/lib/sheets/schema/crm";

export function ContactsTable({ contacts }: { contacts: ContactRecord[] }) {
  return (
    <DataTable<ContactRecord>
      items={contacts}
      emptyIcon={Contact}
      emptyTitle="No contacts yet"
      emptyDescription="Contacts created from leads, housing listings, or manually will show up here."
      searchPlaceholder="Search name, phone, email..."
      searchFn={(c, q) =>
        [c.name, c.phone, c.email, c.relation]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q))
      }
      columns={[
        { header: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
        { header: "Phone", render: (c) => c.phone || "—" },
        { header: "Email", render: (c) => c.email || "—" },
        { header: "Relation", render: (c) => c.relation || "—" },
      ]}
    />
  );
}
