import type { Metadata, Viewport } from "next";
import { Rajdhani, Offside, Sarala } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { LoadingProvider } from "@/components/providers/loading-provider";
import { PwaRegister } from "@/components/providers/pwa-register";

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

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ARGON — AI Command Center",
  description: "AI-powered command center for Gmail and Google Calendar",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ARGON AI",
  },
  icons: {
    icon: [
      { url: "/logo.jpeg" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
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
          >
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </ThemeProvider>
        </QueryProvider>
        <PwaRegister />
      </body>
    </html>
  );
}

