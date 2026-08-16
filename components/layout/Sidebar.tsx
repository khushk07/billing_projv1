import Link from "next/link";
import { NavLink } from "./NavLink";
import { STORE_CONFIG } from "@/lib/storeConfig";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/new-sale", label: "New Sale" },
  { href: "/inventory", label: "Inventory" },
  { href: "/customers", label: "Customers" },
  { href: "/sales-history", label: "Sales History" },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = "" }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-[var(--sidebar-width)] flex-col bg-summit-900 text-white ${className}`}
    >
      <div className="border-b border-summit-800 px-4 py-5">
        <Link href="/dashboard" className="block">
          <h1 className="text-lg font-bold leading-tight tracking-tight">
            {STORE_CONFIG.appShortName}
          </h1>
          <p className="mt-1 text-xs text-summit-300 line-clamp-2">
            {STORE_CONFIG.addressLines[0]}
          </p>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>
      <div className="border-t border-summit-800 p-4 text-xs text-summit-400">
        v1 · PWA ready
      </div>
    </aside>
  );
}
