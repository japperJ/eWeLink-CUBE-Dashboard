"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Settings,
  Zap,
  Wifi,
  WifiOff,
  History,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDevices } from "@/components/providers/device-provider";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { useEffect } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/gateway", label: "Gateway", icon: Server },
  { href: "/setup", label: "Setup", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sseConnected, devices } = useDevices();
  const { open, close } = useSidebar();

  // Close on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      {/* Backdrop overlay — visible when sidebar is open */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">eWeLink CUBE</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-md hover:bg-accent transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors touch-manipulation",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status Footer */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {sseConnected ? (
              <Wifi className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
            )}
            <span>{sseConnected ? "Live" : "Disconnected"}</span>
            <span className="ml-auto">{devices.length} devices</span>
          </div>
        </div>
      </aside>
    </>
  );
}
