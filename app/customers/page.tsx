"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { downloadCsv, downloadJson } from "@/lib/csvExporter";
import { format } from "date-fns";
import type { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [backingUp, setBackingUp] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    const res = await fetch("/api/customers");
    const json = await res.json();
    if (json.success) setCustomers(json.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = () => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    downloadCsv(
      `summit-gear-customers-${dateStr}.csv`,
      ["ID", "Name", "Phone", "Visits", "Total Spent", "Last Purchase", "Categories"],
      customers.map((c) => [
        c.id,
        c.name,
        c.phone,
        c.totalVisits,
        c.totalSpent,
        format(new Date(c.lastPurchaseDate), "yyyy-MM-dd"),
        c.categoriesBought.join("; "),
      ])
    );
  };

  const handleExportFullBackup = async () => {
    setBackingUp(true);
    try {
      const [invRes, custRes, salesRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/customers"),
        fetch("/api/sales"),
      ]);
      const [invJson, custJson, salesJson] = await Promise.all([
        invRes.json(),
        custRes.json(),
        salesRes.json(),
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        customers: custJson.data || customers,
        inventory: invJson.data || [],
        sales: salesJson.data || [],
      };

      const dateStr = format(new Date(), "yyyy-MM-dd_HHmm");
      downloadJson(`summit-gear-full-backup-${dateStr}.json`, backupData);
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Auto-populated from every completed sale"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExport}
              disabled={customers.length === 0}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportFullBackup}
              disabled={backingUp}
              className="border-summit-300 text-summit-700 hover:bg-summit-50"
            >
              {backingUp ? "Generating Backup…" : "Backup All Data (Offline)"}
            </Button>
          </div>
        }
      />
      <div className="mb-4 max-w-sm">
        <Input
          label="Search"
          placeholder="Name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <CustomerTable
        customers={customers}
        search={search}
        onRowClick={(c) => router.push(`/customers/${c.id}`)}
        onExport={handleExport}
      />
    </div>
  );
}
