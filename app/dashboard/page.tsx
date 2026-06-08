"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { RecentSales } from "@/components/dashboard/RecentSales";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      });
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Today's overview"
        action={
          <Link href="/new-sale">
            <Button size="lg">+ New Sale</Button>
          </Link>
        }
      />
      {!stats ? (
        <p className="text-stone-500">Loading...</p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Today's Revenue"
              value={`₹${stats.todayRevenue.toLocaleString("en-IN")}`}
            />
            <StatCard title="Bills Today" value={stats.billsToday} />
            <StatCard
              title="Top Subcategory (Week)"
              value={stats.topSubcategoryThisWeek?.subcategory ?? "—"}
              subtitle={
                stats.topSubcategoryThisWeek
                  ? `${stats.topSubcategoryThisWeek.count} units sold`
                  : undefined
              }
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="mb-3 font-semibold text-stone-800">Low Stock Alerts</h2>
              <LowStockAlert products={stats.lowStockProducts} />
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="mb-3 font-semibold text-stone-800">Recent Sales</h2>
              <RecentSales sales={stats.recentSales} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
