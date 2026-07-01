import type { Metadata } from "next";
import { Rajdhani, Offside, Sarala } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { LoadingProvider } from "@/components/providers/loading-provider";

const rajdhani = Rajdhani({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'], 
  variable: '--font-rajdhani' 
});

const offside = Offside({ 
  weight: ['400'],
  subsets: ['latin'], 
  variable: '--font-offside' 
});

const sarala = Sarala({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: "--font-sarala",
});

export const metadata: Metadata = {
  title: "ARGON — AI Command Center",
  description: "AI-powered command center for Gmail and Google Calendar",
  icons: {
    icon: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", sarala.variable, rajdhani.variable, offside.variable, "font-sans")}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
