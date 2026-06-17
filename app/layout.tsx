import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { QueryProvider } from "@/components/providers/query-provider";
import { OfflineSyncProvider } from "@/components/providers/offline-sync-provider";
import { ConnectionStatus } from "@/components/layout/connection-status";
import { HelpDrawer } from "@/components/help/help-drawer";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/user-util";
import { getDisabledPages } from "@/app/actions/admin-permissions";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Co+promote - Marketing Management",
  description: "Manage your marketing projects and assets.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Co+promote",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const role = user?.role || 'USER';
  const disabledPages = await getDisabledPages(role);

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
                    
                    var themeMap = {
                      '#007934': { secondary: '#7AB800', accent: '#FF5800' },
                      '#7AB800': { secondary: '#007934', accent: '#FF5800' },
                      '#FF5800': { secondary: '#FFA100', accent: '#622567' },
                      '#622567': { secondary: '#B382C7', accent: '#FF5800' },
                      '#005293': { secondary: '#00B0CA', accent: '#FF5800' },
                      '#D50032': { secondary: '#1e1e1e', accent: '#FF5800' }
                    };
                    var mapping = themeMap[savedPrimary];
                    if (mapping) {
                      document.documentElement.style.setProperty('--secondary', mapping.secondary);
                      document.documentElement.style.setProperty('--accent', mapping.accent);
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <OfflineSyncProvider>
          <QueryProvider>
            <ConnectionStatus />
            <div className="flex h-screen bg-slate-50 flex-col lg:flex-row">
              <Sidebar disabledPages={disabledPages} />
              <main className="flex-1 overflow-auto w-full">
                {children}
              </main>
            </div>
            <HelpDrawer />
            <Toaster />
          </QueryProvider>
        </OfflineSyncProvider>
      </body>
    </html>
  );
}
