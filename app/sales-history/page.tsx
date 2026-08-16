"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/categories";
import { downloadCsv } from "@/lib/csvExporter";
import type { Sale } from "@/types";

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [category, setCategory] = useState("");
  const [minAmount, setMinAmount] = useState("");

  useEffect(() => {
    fetch("/api/sales")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSales(json.data);
      });
  }, []);

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (dateFrom) {
        const from = parseISO(dateFrom);
        if (new Date(s.createdAt) < from) return false;
      }
      if (dateTo) {
        const to = parseISO(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(s.createdAt) > to) return false;
      }
      if (minAmount && s.grandTotal < Number(minAmount)) return false;
      if (category) {
        const hasCat = s.items.some((i) => i.category === category);
        if (!hasCat) return false;
      }
      return true;
    });
  }, [sales, dateFrom, dateTo, category, minAmount]);

  const itemsSummary = (s: Sale) =>
    s.items.map((i) => `${i.name}×${i.quantity}`).join(", ");

  const handleExport = () => {
    downloadCsv(
      "summit-gear-sales.csv",
      ["Bill", "Date", "Customer", "Phone", "Items", "Total"],
      filtered.map((s) => [
        s.billNumber,
        format(new Date(s.createdAt), "yyyy-MM-dd HH:mm"),
        s.customerName,
        s.customerPhone,
        itemsSummary(s),
        s.grandTotal,
      ])
    );
  };

  return (
    <div>
      <PageHeader
        title="Sales History"
        subtitle="All completed bills"
        action={
          <Button variant="secondary" size="sm" onClick={handleExport}>
            Export CSV
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="From date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input label="To date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: "", label: "All" },
            ...CATEGORIES.map((c) => ({ value: c.name, label: c.name })),
          ]}
        />
        <Input label="Min amount (₹)" type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-left text-stone-600">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Bill</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((s) => (
              <Fragment key={s.id}>
                <tr
                  className="cursor-pointer hover:bg-stone-50"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                >
                  <td className="px-4 py-3">{expanded === s.id ? "▼" : "▶"}</td>
                  <td className="px-4 py-3 font-medium">{s.billNumber}</td>
                  <td className="px-4 py-3">
                    {format(new Date(s.createdAt), "dd MMM yyyy, hh:mm a")}
                  </td>
                  <td className="px-4 py-3">{s.customerName}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-stone-500">
                    {itemsSummary(s)}
                  </td>
                  <td className="px-4 py-3 font-medium">₹{s.grandTotal}</td>
                </tr>
                {expanded === s.id && (
                  <tr>
                    <td colSpan={6} className="bg-stone-50 px-8 py-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-stone-500">
                            <th className="text-left py-1">Item</th>
                            <th>Subcategory</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-1">{item.name}</td>
                              <td>{item.subcategory}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-center">₹{item.unitPrice}</td>
                              <td className="text-right">₹{item.lineTotal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-stone-500">No sales match filters.</p>
        )}
      </div>
    </div>
  );
}
