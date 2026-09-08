import { requireAuth } from "@/features/auth/actions";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return <div className="min-h-dvh bg-background">{children}</div>;
}
