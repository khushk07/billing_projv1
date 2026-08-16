"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { STORE_CONFIG } from "@/lib/storeConfig";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/new-sale", label: "New Sale" },
  { href: "/inventory", label: "Inventory" },
  { href: "/customers", label: "Customers" },
  { href: "/sales-history", label: "Sales History" },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close menu"
      />
      <aside className="absolute left-0 top-0 flex h-full w-[min(280px,85vw)] flex-col bg-summit-900 text-white shadow-xl safe-top">
        <div className="flex items-center justify-between border-b border-summit-800 px-4 py-4">
          <div>
            <p className="font-bold">{STORE_CONFIG.appShortName}</p>
            <p className="text-xs text-summit-400">Store Management</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-summit-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/" || pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block rounded-lg px-3 py-3 text-base font-medium ${
                  isActive
                    ? "bg-summit-700 text-white"
                    : "text-stone-300 hover:bg-summit-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
