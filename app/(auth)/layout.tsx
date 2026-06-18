import { requireUnauth } from "@/features/auth/actions";
import AuthLayoutClient from "./auth-layout-client";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await requireUnauth();
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
