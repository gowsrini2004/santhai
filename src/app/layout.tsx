import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SANTHAI STUDIO | Audio Loop Practice",
  description: "Modern audio looping for sloka, mantra, and Vedic recitation practice.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "SANTHAI STUDIO" },
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
  width: "device-width",
  initialScale: 1,
};

import CreatorBadge from "@/components/branding/CreatorBadge";
import NotificationToast from "@/components/notifications/NotificationToast";
import FeedbackWidget from "@/components/branding/FeedbackWidget";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <CreatorBadge />
        <FeedbackWidget />
        <NotificationToast />
      </body>
    </html>
  );
}
