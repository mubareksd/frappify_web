"use client";

import AppSidebar from "@/components/layout/dashboard/app-sidebar";
import Footer from "@/components/layout/dashboard/footer";
import Header from "@/components/layout/dashboard/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";

interface ProtectedAppShellProps {
  children?: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    username?: string;
    image?: string | null;
  };
}

const FULL_WIDTH_STORAGE_KEY = "frappify:app:full-width";

export default function ProtectedAppShell({
  children,
  user,
}: ProtectedAppShellProps) {
  const [isFullWidth, setIsFullWidth] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      const saved = window.localStorage.getItem(FULL_WIDTH_STORAGE_KEY);
      return saved === "1";
    } catch {
      return false;
    }
  });

  const handleToggleFullWidth = () => {
    setIsFullWidth((prev) => {
      const next = !prev;

      try {
        window.localStorage.setItem(FULL_WIDTH_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // no-op
      }

      return next;
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header
          user={user}
          isFullWidth={isFullWidth}
          onToggleFullWidth={handleToggleFullWidth}
        />
        <main className="flex-1">
          <div className={isFullWidth ? "w-full px-4 py-4 md:px-6" : "mx-auto w-full max-w-7xl px-4 py-4 md:px-6"}>
            {children}
          </div>
        </main>
        <Footer isFullWidth={isFullWidth} />
      </SidebarInset>
    </SidebarProvider>
  );
}
