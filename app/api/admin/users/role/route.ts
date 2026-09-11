import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

/**
 * PATCH /api/admin/users/role
 * Only the Super Admin (priyanshu82711@gmail.com) can change user roles.
 * Regular Admins cannot change anyone's role.
 * The Super Admin's own role cannot be changed.
 */
export async function PATCH(request: Request) {
  const { isSuperAdmin, session } = await isAdmin();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Super Admin can change roles
  if (!isSuperAdmin) {
    return NextResponse.json(
      { error: "Only the Super Admin can change user roles" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    // Validate role value — can only assign "client" or "admin"
    if (role !== "client" && role !== "admin") {
      return NextResponse.json(
        { error: 'Role must be either "client" or "admin"' },
        { status: 400 }
      );
    }

    // Fetch the target user to check if it's the Super Admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent changing the Super Admin's own role
    if (SUPER_ADMIN_EMAIL && targetUser.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Cannot change the Super Admin's role" },
        { status: 403 }
      );
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Role update error:", err);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
