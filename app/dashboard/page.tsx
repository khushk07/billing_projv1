"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { downloadTaxSummaryCsv } from "@/lib/csvExporter";
import type { DashboardStats, Sale } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [downloadingTax, setDownloadingTax] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      });
  }, []);

  const handleDownloadTaxSummary = async () => {
    setDownloadingTax(true);
    try {
      const res = await fetch("/api/sales");
      const json = await res.json();
      if (json.success && json.data) {
        downloadTaxSummaryCsv(json.data as Sale[]);
      }
    } finally {
      setDownloadingTax(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Today's overview & quick reports"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleDownloadTaxSummary}
              disabled={downloadingTax}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              {downloadingTax ? "Generating Tax Summary…" : "Download Tax Summary"}
            </Button>
            <Link href="/new-sale">
              <Button size="lg">+ New Sale</Button>
            </Link>
          </div>
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
