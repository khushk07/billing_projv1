import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { STORE_CONFIG } from "@/lib/storeConfig";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: `${STORE_CONFIG.appShortName} — Store`,
    template: `%s · ${STORE_CONFIG.appShortName}`,
  },
  description:
    "Billing, inventory, and customer tracking. Install on your phone for counter sales.",
  applicationName: STORE_CONFIG.appShortName,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: STORE_CONFIG.appShortName,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/store-logo.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: STORE_CONFIG.themeColor,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
