"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileDrawer } from "./MobileDrawer";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Sidebar className="hidden lg:flex" />
      <MobileHeader onOpenMenu={() => setMenuOpen(true)} />
      <MobileDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="min-h-screen pt-14 lg:pt-0 lg:pl-[var(--sidebar-width)]">
        <div className="mx-auto max-w-6xl p-4 pb-8 sm:p-6 lg:p-8">{children}</div>
      </main>
      <InstallPrompt />
    </>
  );
}
