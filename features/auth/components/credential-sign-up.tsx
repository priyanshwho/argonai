"use client";

import { useState } from "react";
import { useRouter } from "@/components/providers/loading-provider";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { DEFAULT_AUTH_CALLBACK } from "../utils";

interface CredentialSignUpProps {
  callbackUrl?: string;
  onUseDemo?: () => void;
}

export function CredentialSignUp({ callbackUrl, onUseDemo }: CredentialSignUpProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await authClient.signUp.email(
        {
          email,
          password,
          name,
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
            setError(ctx.error.message || "Failed to create account. Email may already be in use.");
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
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {/* Demo Credentials Quick Fill & Switch Banner */}
      {onUseDemo && (
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-200">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 w-full xs:w-auto">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-semibold text-foreground">Explore with Demo Account</p>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-medium">Instant Test</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono truncate">demo.argon22@gmail.com</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUseDemo}
            className="self-end xs:self-auto shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-foreground hover:bg-primary transition-all duration-150 cursor-pointer bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 active:scale-95"
          >
            <span>Fill & Sign In</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 sm:p-3 text-xs sm:text-sm text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="pl-9 sm:pl-10 h-10 sm:h-11 text-xs sm:text-sm border-border/10 bg-white/[0.03] dark:bg-black/10 backdrop-blur-md focus-visible:ring-1"
            required
            autoComplete="name"
          />
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="pl-9 sm:pl-10 h-10 sm:h-11 text-xs sm:text-sm border-border/10 bg-white/[0.03] dark:bg-black/10 backdrop-blur-md focus-visible:ring-1"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="password" className="text-xs sm:text-sm font-medium">Password (min 8 characters)</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="pl-9 sm:pl-10 pr-10 h-10 sm:h-11 text-xs sm:text-sm border-border/10 bg-white/[0.03] dark:bg-black/10 backdrop-blur-md focus-visible:ring-1"
            required
            autoComplete="new-password"
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
        className="w-full h-10 sm:h-11 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer font-medium mt-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
}
