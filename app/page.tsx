import Link from "next/link";
import { ArrowRight, Star, Mail, Calendar, Bot, Shield, Zap, Sparkles } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800 selection:text-zinc-100 overflow-x-hidden">
      
      {/* Sticky glassmorphic navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 shadow-inner">
              <Star className="h-5 w-5 fill-current text-zinc-950" />
            </div>
            <span className="text-xl font-bold font-serif tracking-tight text-white">Locus</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
            <a href="#integrations" className="hover:text-zinc-100 transition-colors">Integrations</a>
            <a href="#security" className="hover:text-zinc-100 transition-colors">Security</a>
            <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-100 transition-colors">Docs</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/sign-in" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="flex h-9 items-center justify-center rounded-full bg-zinc-100 px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 active:scale-95 transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden">
          
          {/* Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[600px] w-full max-w-7xl opacity-30 blur-[130px] pointer-events-none">
            <div className="absolute top-[-10%] left-[10%] h-[350px] w-[350px] rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="absolute top-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
            
            {/* Glowing gradient badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
              <span>Unified AI Command Center</span>
            </div>

            {/* Title */}
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl font-serif leading-tight">
              Your Inbox and Calendar, <br />
              <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-600 bg-clip-text text-transparent">
                Supercharged by AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-lg text-zinc-400 leading-relaxed font-sans">
              Locus brings Gmail and Google Calendar into a single dynamic command workspace, utilizing autonomous scheduling and drafting agents to streamline your productivity.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
              <Link 
                href="/sign-up" 
                className="group flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-zinc-200 active:scale-95 transition-all shadow-lg"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a 
                href="#features" 
                className="flex h-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 px-6 text-sm font-medium text-zinc-300 hover:text-white backdrop-blur-sm active:scale-95 transition-all"
              >
                Learn More
              </a>
            </div>

            {/* Interface Mockup */}
            <div className="pt-16 max-w-5xl mx-auto">
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-blue-500/5">
                <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 overflow-hidden aspect-[16/9] flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/90 to-zinc-900/80 -z-10" />
                  
                  {/* Mock content representation */}
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <Bot className="h-12 w-12 text-zinc-400" />
                    <h3 className="text-lg font-bold text-zinc-200 font-serif">ChatGPT-Like Workspace Interface</h3>
                    <p className="text-xs text-zinc-500 max-w-sm">
                      Interactive conversation console, sidebar context folders, and seamless Google APIs connections.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 border-t border-zinc-900 bg-zinc-950 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl font-bold font-serif text-white tracking-tight sm:text-4xl">
                Engineered for Infinite Focus
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                No more context switching. Interact with your workspace, drafts, and meetings via simple dialogue.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-8 hover:border-zinc-800 transition-colors">
                <div className="rounded-lg bg-zinc-900 p-3 w-fit text-zinc-200 mb-6">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 font-serif">Gmail Integration</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Autonomously fetches incoming correspondence, draft intelligent responses, and syncs caches instantly.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-8 hover:border-zinc-800 transition-colors">
                <div className="rounded-lg bg-zinc-900 p-3 w-fit text-zinc-200 mb-6">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 font-serif">Smart Calendar</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Resolves schedule conflicts, searches for free slots, and registers new events dynamically via prompt commands.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-8 hover:border-zinc-800 transition-colors">
                <div className="rounded-lg bg-zinc-900 p-3 w-fit text-zinc-200 mb-6">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 font-serif">AI Agent Layer</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Powered by Google Gemini 1.5 Pro to execute custom workflow tools natively from your context database.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security / Connection Section */}
        <section id="security" className="py-20 border-t border-zinc-900 bg-zinc-950/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-900 bg-zinc-950 p-8 sm:p-12 relative overflow-hidden flex flex-col items-center text-center gap-6">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
              <Shield className="h-10 w-10 text-zinc-400" />
              <h3 className="text-2xl font-bold text-white font-serif">Secure Encryption Standard</h3>
              <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
                Your credentials and API secrets are protected using advanced Key Encryption Keys (KEK) and stored safely in specialized multi-tenancy caches.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <span className="font-serif font-bold text-zinc-400 text-sm">Locus</span>
          <span>&copy; {new Date().getFullYear()} Locus Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
