import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AUTQORA — Organize automation implementation projects",
    template: "%s — AUTQORA",
  },
  description:
    "Save automation project briefs, track implementation status, and troubleshoot common workflow errors. Project planning and workflow generation are being built.",
  keywords: [
    "automation",
    "workflow automation",
    "n8n",
    "AI agents",
    "automation implementation",
    "workflow orchestration",
  ],
  applicationName: "AUTQORA",
  authors: [{ name: "AUTQORA" }],
  openGraph: {
    title: "AUTQORA — Organize automation implementation projects",
    description:
      "Save automation project briefs, track implementation status, and troubleshoot common workflow errors.",
    siteName: "AUTQORA",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "AUTQORA — Organize automation implementation projects",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AUTQORA — Organize automation implementation projects",
    description:
      "Save automation project briefs, track implementation status, and troubleshoot common workflow errors.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07060a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${sora.variable} ${inter.variable} ${jetbrains.variable} bg-ink text-mist antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-mist focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
        >
          Skip to content
        </a>
        <TooltipProvider>
          <Toaster />
          {children}
        </TooltipProvider>
        {/* WARNING FOR AGENT: DO NOT REMOVE THIS SCRIPT */}
        <Script src="https://cdn.jsdelivr.net/gh/IdeavoAI/ideavo-scripts@latest/scripts/ideavo.min.js" />
      </body>
    </html>
  );
}
