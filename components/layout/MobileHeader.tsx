"use client";

import Link from "next/link";
import { STORE_CONFIG } from "@/lib/storeConfig";

interface MobileHeaderProps {
  onOpenMenu: () => void;
}

export function MobileHeader({ onOpenMenu }: MobileHeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-summit-800 bg-summit-900 px-4 text-white lg:hidden safe-top">
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl hover:bg-summit-800"
        aria-label="Open menu"
      >
        ☰
      </button>
      <Link href="/dashboard" className="truncate px-2 text-center font-semibold">
        {STORE_CONFIG.appShortName}
      </Link>
      <Link
        href="/new-sale"
        className="rounded-lg bg-summit-600 px-3 py-2 text-sm font-medium hover:bg-summit-500"
      >
        + Sale
      </Link>
    </header>
  );
}
