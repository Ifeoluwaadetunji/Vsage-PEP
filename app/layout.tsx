import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vsage Mail",
  description: "Personal Professional Email Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vsage Mail",
  },
};

export const viewport = {
  themeColor: "#000000",
};

import { ToastProvider } from "@/components/ui/ToastProvider";

import { PWARegistration } from "@/components/PWARegistration";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body>
        <PWARegistration />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
