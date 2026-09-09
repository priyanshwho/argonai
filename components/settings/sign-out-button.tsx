"use client";

import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { SIGN_IN_PATH } from "@/features/auth/utils";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push(SIGN_IN_PATH);
          },
        },
      });
    } catch (err) {
      console.error("Sign out failed:", err);
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={loading}
      className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 border-border bg-card rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>{loading ? "Signing out..." : "Sign Out"}</span>
    </Button>
  );
}
