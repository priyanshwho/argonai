import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

/**
 * Server-side admin guard.
 * Allows access if the user is:
 *   - The Super Admin (email matches ADMIN_EMAIL env var), OR
 *   - A user with role "admin" or "super_admin" in the database.
 * Redirects non-admin users to /dashboard.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Super Admin always has access
  if (SUPER_ADMIN_EMAIL && session.user.email === SUPER_ADMIN_EMAIL) {
    return session;
  }

  // Check database role for other users
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "super_admin")) {
    redirect("/dashboard");
  }

  return session;
}

/**
 * API-level admin check (no redirect, returns privilege info).
 * Use in API routes that return JSON responses.
 */
export async function isAdmin(): Promise<{
  isAdmin: boolean;
  isSuperAdmin: boolean;
  session: any;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { isAdmin: false, isSuperAdmin: false, session: null };
  }

  // Check if Super Admin by email
  const isSuperAdminByEmail =
    !!SUPER_ADMIN_EMAIL && session.user.email === SUPER_ADMIN_EMAIL;

  if (isSuperAdminByEmail) {
    return { isAdmin: true, isSuperAdmin: true, session };
  }

  // Check database role
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const role = dbUser?.role || "client";
  const isAdminRole = role === "admin" || role === "super_admin";

  return {
    isAdmin: isAdminRole,
    isSuperAdmin: false, // Only the env-designated email is the true Super Admin
    session,
  };
}
