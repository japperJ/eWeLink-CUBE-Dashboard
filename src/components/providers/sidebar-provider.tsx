"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface SidebarContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  // Close sidebar on route change (detected via popstate)
  useEffect(() => {
    const handleResize = () => {
      // Auto-close on resize to smaller screen
      if (window.innerWidth < 768) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <SidebarContext value={{ open, toggle, close }}>
      {children}
    </SidebarContext>
  );
}
