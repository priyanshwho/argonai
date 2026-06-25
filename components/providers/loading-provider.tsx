"use client";

import React, { createContext, useContext, useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams, useRouter as useNextRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const LoadingContext = createContext<{
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

function NavigationStateTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { stopLoading } = useLoading();

  useEffect(() => {
    stopLoading();
  }, [pathname, searchParams, stopLoading]);

  return null;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  // Global click handler to intercept internal link clicks
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      while (target && target.tagName !== "A") {
        target = target.parentElement as HTMLElement;
      }
      if (target && target.tagName === "A") {
        const href = target.getAttribute("href");
        const targetAttr = target.getAttribute("target");
        
        // Intercept internal route transitions only
        if (
          href &&
          href.startsWith("/") &&
          !href.startsWith("/#") &&
          targetAttr !== "_blank" &&
          !e.metaKey &&
          !e.ctrlKey
        ) {
          const targetPathname = href.split("?")[0].split("#")[0];
          const currentPathname = window.location.pathname;
          if (targetPathname !== currentPathname) {
            startLoading();
          }
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  // Fallback timeout to prevent permanent loading screens in case of network issues
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 8000); // 8 seconds fallback
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      <Suspense fallback={null}>
        <NavigationStateTracker />
      </Suspense>
      
      {/* Dynamic blurred container wrapping application children */}
      <div className={`min-h-full flex flex-col transition-all duration-300 ${isLoading ? "blur-[6px] pointer-events-none select-none scale-[0.99] opacity-80" : ""}`}>
        {children}
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-card/95 border border-border shadow-2xl backdrop-blur-xl animate-in scale-in duration-200">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground font-sans">Loading workspace</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">Please wait, preparing content...</p>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

// Custom hook wrapper for useRouter to automatically trigger loading state on router.push/replace
export function useRouter() {
  const router = useNextRouter();
  const { startLoading } = useLoading();

  return {
    ...router,
    push: (href: string, options?: any) => {
      if (href.startsWith("/")) {
        const targetPathname = href.split("?")[0].split("#")[0];
        const currentPathname = window.location.pathname;
        if (targetPathname !== currentPathname) {
          startLoading();
        }
      }
      return router.push(href, options);
    },
    replace: (href: string, options?: any) => {
      if (href.startsWith("/")) {
        const targetPathname = href.split("?")[0].split("#")[0];
        const currentPathname = window.location.pathname;
        if (targetPathname !== currentPathname) {
          startLoading();
        }
      }
      return router.replace(href, options);
    },
  };
}
