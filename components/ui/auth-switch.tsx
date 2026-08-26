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
  const [demoTrigger, setDemoTrigger] = useState<{ email: string; password: string; timestamp: number } | null>(null);

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

  const handleUseDemo = () => {
    setDemoTrigger({
      email: "demo.argon22@gmail.com",
      password: "peter@22",
      timestamp: Date.now(),
    });
    if (activeTab !== "signin") {
      handleTabChange("signin");
    }
  };

  return (
    <Card className="border border-[#c41e3a]/40 dark:border-[#c41e3a]/30 bg-white/5 dark:bg-black/20 backdrop-blur-3xl shadow-2xl sm:rounded-2xl transition-all duration-300 hover:border-[#c41e3a]/70 dark:hover:border-[#c41e3a]/60 hover:shadow-[0_0_25px_rgba(196,30,58,0.15)]">
      <CardHeader className="space-y-4 text-center pt-8">
        <CardTitle className="text-4xl font-semibold tracking-tight font-serif text-foreground">
          ARGON AI
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm max-w-[280px] mx-auto">
          {activeTab === "signin" 
            ? "Welcome back. Enter your credentials."
            : "Create an account to manage Gmail and Calendar."
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6">
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
                <CredentialSignIn callbackUrl={callbackUrl} demoTrigger={demoTrigger} />
              ) : (
                <CredentialSignUp callbackUrl={callbackUrl} onUseDemo={handleUseDemo} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Centered Switch Link */}
        <div className="text-center text-sm text-muted-foreground">
          {activeTab === "signin" ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => handleTabChange("signup")}
                className="text-primary hover:underline font-medium cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
              >
                Create account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => handleTabChange("signin")}
                className="text-primary hover:underline font-medium cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
              >
                Login
              </button>
            </>
          )}
        </div>

        {/* Separator Line */}
        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-border/20" />
          <span className="text-xs uppercase text-muted-foreground shrink-0">
            {activeTab === "signin" ? "Or continue with" : "Or sign up with"}
          </span>
          <div className="h-[1px] flex-1 bg-border/20" />
        </div>

        {/* OAuth Buttons at the bottom */}
        <OAuthSignIn callbackUrl={callbackUrl} />
      </CardContent>
    </Card>
  );
}
