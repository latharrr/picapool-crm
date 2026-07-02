import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";

/** First page this role actually has access to — avoids landing anyone on a permission-denied screen. */
export default async function RootPage() {
  const session = await requireSession();
  const role = session.user.role;

  if (hasPermission(role, "VIEW_ANALYTICS")) redirect("/dashboard");
  if (hasPermission(role, "CALL")) redirect("/calling");
  redirect("/leads");
}
