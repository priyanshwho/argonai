"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/components/providers/loading-provider";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { DEFAULT_AUTH_CALLBACK } from "../utils";

export const DEMO_CREDENTIALS = {
  email: "demo.argon22@gmail.com",
  password: "peter@22",
};

interface CredentialSignInProps {
  callbackUrl?: string;
  demoTrigger?: { email: string; password: string; timestamp: number } | null;
  onFillDemo?: () => void;
}

export function CredentialSignIn({ callbackUrl, demoTrigger }: CredentialSignInProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError(null);
  };

  // Sync when demoTrigger changes from parent
  useEffect(() => {
    if (demoTrigger) {
      setEmail(demoTrigger.email);
      setPassword(demoTrigger.password);
      setError(null);
    }
  }, [demoTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      await authClient.signIn.email(
        {
          email,
          password,
          callbackURL: callbackUrl || DEFAULT_AUTH_CALLBACK,
        },
        {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: () => {
            router.push(callbackUrl || DEFAULT_AUTH_CALLBACK);
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Invalid email or password");
            setLoading(false);
          },
        }
      );
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Demo Credentials Quick Fill Banner */}
      <div className="flex items-center justify-between p-2.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-foreground">Demo Credentials</p>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-medium">Quick Access</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{DEMO_CREDENTIALS.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fillDemo}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-foreground hover:bg-primary transition-all duration-150 cursor-pointer bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 active:scale-95"
        >
          <span>Auto-fill</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="pl-10 h-11 border-border/10 bg-white/[0.03] dark:bg-black/10 backdrop-blur-md focus-visible:ring-1"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="pl-10 pr-10 h-11 border-border/10 bg-white/[0.03] dark:bg-black/10 backdrop-blur-md focus-visible:ring-1"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 flex items-center justify-center gap-2 cursor-pointer font-medium"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
