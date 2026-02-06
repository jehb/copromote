import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { QueryProvider } from "@/components/providers/query-provider";
import { OfflineSyncProvider } from "@/components/providers/offline-sync-provider";
import { ConnectionStatus } from "@/components/layout/connection-status";
import { HelpDrawer } from "@/components/help/help-drawer";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Promoty - Marketing Management",
  description: "Manage your marketing projects and assets.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Promoty",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedPrimary = localStorage.getItem('theme-primary');
                  if (savedPrimary) {
                    document.documentElement.style.setProperty('--primary', savedPrimary);
                    document.documentElement.style.setProperty('--ring', savedPrimary);
                    document.documentElement.style.setProperty('--sidebar-primary', savedPrimary);
                    document.documentElement.style.setProperty('--sidebar-ring', savedPrimary);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <OfflineSyncProvider>
          <QueryProvider>
            <ConnectionStatus />
            <div className="flex h-screen bg-slate-50">
              <Sidebar />
              <main className="flex-1 overflow-auto w-full lg:w-auto">
                {children}
              </main>
            </div>
            <HelpDrawer />
          </QueryProvider>
        </OfflineSyncProvider>
      </body>
    </html>
  );
}
