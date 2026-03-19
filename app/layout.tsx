import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { getCurrentUser } from "@/actions/user-actions";
import { AdminFab } from "@/components/admin-fab";
import { BugReportButton } from "@/components/bug-report-button";
import { SuggestionButton } from "@/components/suggestion-button";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PresenceTracker } from "@/components/admin/presence-tracker";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: "Kifted",
  description: "Track your strength, nutrition, cardio, and goals — all in one place.",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userResult = session ? await getCurrentUser() : null;
  const accentColor = userResult?.success ? userResult.data.preferences?.accentColor : undefined;
  const theme = userResult?.success ? userResult.data.preferences?.theme : undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="scroll-smooth"
      {...(accentColor && accentColor !== "indigo" ? { "data-accent": accentColor } : {})}
    >
      <body className={`${geistMono.variable} antialiased`}>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme={theme ?? "system"}
            enableSystem
            disableTransitionOnChange
          >
            <div className={session ? "pb-16 sm:pb-0" : undefined}>
              {children}
            </div>
            {session && <PresenceTracker />}
            <MobileBottomNav />
            <AdminFab />
            <SuggestionButton />
            <BugReportButton />
            <PwaInstallPrompt />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
