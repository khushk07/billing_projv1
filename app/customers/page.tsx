"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { downloadCsv } from "@/lib/csvExporter";
import { format } from "date-fns";
import type { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
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
    downloadCsv(
      "summit-gear-customers.csv",
      ["Name", "Phone", "Visits", "Total Spent", "Last Purchase", "Categories"],
      customers.map((c) => [
        c.name,
        c.phone,
        c.totalVisits,
        c.totalSpent,
        format(new Date(c.lastPurchaseDate), "yyyy-MM-dd"),
        c.categoriesBought.join("; "),
      ])
    );
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Auto-populated from every completed sale"
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
