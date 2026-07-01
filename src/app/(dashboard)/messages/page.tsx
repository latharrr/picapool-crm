import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="WhatsApp and email history logged against leads."
      />
      <Tabs defaultValue="whatsapp">
        <TabsList>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>
        <TabsContent value="whatsapp" className="mt-4 space-y-4">
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            Not yet connected
          </Badge>
          <EmptyState
            icon={MessageSquare}
            title="No WhatsApp messages logged"
            description="WhatsApp Cloud API isn't connected yet. Messages sent manually can still be logged here for history."
          />
        </TabsContent>
        <TabsContent value="email" className="mt-4 space-y-4">
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            Not yet connected
          </Badge>
          <EmptyState
            icon={MessageSquare}
            title="No emails logged"
            description="An email provider (e.g. Resend/SendGrid) isn't connected yet. Emails sent manually can still be logged here for history."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
