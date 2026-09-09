import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side admin guard.
 * Checks that the current session user's email matches ADMIN_EMAIL env var.
 * Redirects non-admin users to /dashboard.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || session.user.email !== adminEmail) {
    redirect("/dashboard");
  }

  return session;
}

/**
 * API-level admin check (no redirect, returns boolean).
 * Use in API routes that return JSON responses.
 */
export async function isAdmin(): Promise<{ isAdmin: boolean; session: any }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { isAdmin: false, session: null };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  return {
    isAdmin: !!adminEmail && session.user.email === adminEmail,
    session,
  };
}
