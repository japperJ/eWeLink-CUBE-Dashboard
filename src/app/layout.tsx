import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DeviceProvider } from "@/components/providers/device-provider";
import { SidebarProvider } from "@/components/providers/sidebar-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eWeLink CUBE Dashboard",
  description: "Control and monitor your eWeLink CUBE devices",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex">
        <TooltipProvider>
          <DeviceProvider>
            <SidebarProvider>
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                <Header />
                <main className="flex-1 p-3 sm:p-4 md:p-6">{children}</main>
              </div>
            </SidebarProvider>
            <Toaster />
          </DeviceProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
