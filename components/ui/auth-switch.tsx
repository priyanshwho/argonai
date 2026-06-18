"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OAuthSignIn } from "@/features/auth/components/oauth-sign-in";
import { CredentialSignIn } from "@/features/auth/components/credential-sign-in";
import { CredentialSignUp } from "@/features/auth/components/credential-sign-up";

interface AuthSwitchProps {
  callbackUrl?: string;
}

export function AuthSwitch({ callbackUrl }: AuthSwitchProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Set default active tab based on current pathname
  const initialTab = pathname?.includes("/sign-up") ? "signup" : "signin";
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(initialTab);

  // Sync active tab with pathname changes (e.g. browser back/forward buttons)
  useEffect(() => {
    const tab = pathname?.includes("/sign-up") ? "signup" : "signin";
    setActiveTab(tab);
  }, [pathname]);

  const handleTabChange = (tab: "signin" | "signup") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    
    // Update the URL to match the active tab without full page reload
    const targetUrl = tab === "signin" 
      ? `/sign-in${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`
      : `/sign-up${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
    
    router.replace(targetUrl);
  };

  return (
    <Card className="border border-border/40 bg-card/65 backdrop-blur-xl shadow-2xl sm:rounded-2xl transition-all duration-300 hover:border-border/60">
      <CardHeader className="space-y-4 text-center pt-8">
        <CardTitle className="text-4xl font-semibold tracking-tight font-serif text-foreground">
          Locus
        </CardTitle>
        
        {/* Sliding Premium Tab Switch */}
        <div className="relative flex p-1.5 bg-muted/50 dark:bg-muted/20 border border-border/20 rounded-full w-full max-w-[240px] mx-auto">
          {/* Active Tab Sliding Background */}
          <motion.div
            className="absolute inset-y-1.5 rounded-full bg-background dark:bg-zinc-800 border border-border/30 shadow-xs"
            layoutId="activeTabIndicator"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{
              width: "calc(50% - 12px)",
              left: activeTab === "signin" ? "6px" : "calc(50% + 6px)"
            }}
          />

          <button
            type="button"
            onClick={() => handleTabChange("signin")}
            className={`relative z-10 w-1/2 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-colors duration-200 ${
              activeTab === "signin" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          
          <button
            type="button"
            onClick={() => handleTabChange("signup")}
            className={`relative z-10 w-1/2 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-colors duration-200 ${
              activeTab === "signup" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        <CardDescription className="text-muted-foreground text-sm max-w-[280px] mx-auto">
          {activeTab === "signin" 
            ? "Welcome back. Choose your login method."
            : "Create an account to manage Gmail and Calendar."
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6">
        <OAuthSignIn callbackUrl={callbackUrl} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {activeTab === "signin" ? "Or continue with email" : "Or sign up with email"}
            </span>
          </div>
        </div>

        {/* Tab Forms Content with Fade Animation */}
        <div className="relative min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "signin" ? (
                <CredentialSignIn callbackUrl={callbackUrl} />
              ) : (
                <CredentialSignUp callbackUrl={callbackUrl} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
