"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Settings,
  Zap,
  Menu,
  History,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useSidebar } from "@/components/providers/sidebar-provider";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/gateway", label: "Gateway", icon: Server },
  { href: "/setup", label: "Setup", icon: Settings },
];

export function Header() {
  const pathname = usePathname();
  const { toggle } = useSidebar();

  const current = navItems.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Left side: menu + logo/title */}
        <div className="flex items-center gap-3">
          <button
            className="p-2.5 -ml-2 rounded-md hover:bg-accent transition-colors touch-manipulation"
            onClick={toggle}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">CUBE</span>
          </div>

          {/* Page title (desktop) */}
          <h2 className="hidden lg:block text-lg font-semibold">
            {current?.label || "eWeLink CUBE"}
          </h2>
        </div>

        {/* Right side */}
        <ThemeToggle />
      </div>
    </header>
  );
}
