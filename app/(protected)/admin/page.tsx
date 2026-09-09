import { requireAdmin } from "@/lib/admin";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  // Server-side guard: redirects non-admin users
  await requireAdmin();

  return <AdminClient />;
}
