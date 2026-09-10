"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/categories";
import { downloadCsv, downloadTaxSummaryCsv, generateTaxSummaryRows } from "@/lib/csvExporter";
import type { Sale } from "@/types";

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [viewMode, setViewMode] = useState<"bills" | "tax">("bills");
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

  const taxRows = useMemo(() => {
    return generateTaxSummaryRows(filtered);
  }, [filtered]);

  // Tax Summary Totals
  const totalTaxUnits = useMemo(() => taxRows.reduce((sum, r) => sum + r.quantity, 0), [taxRows]);
  const totalTaxGross = useMemo(() => taxRows.reduce((sum, r) => sum + r.totalValue, 0), [taxRows]);
  const totalTaxBase = useMemo(() => taxRows.reduce((sum, r) => sum + r.baseValue, 0), [taxRows]);
  const totalTaxAmount = useMemo(() => taxRows.reduce((sum, r) => sum + r.tax, 0), [taxRows]);

  const itemsSummary = (s: Sale) =>
    s.items.map((i) => `${i.name}×${i.quantity}`).join(", ");

  const handleExportBills = () => {
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

  const handleExportTaxSummary = () => {
    downloadTaxSummaryCsv(filtered);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Tax Reports"
        subtitle="Manage sales bills and download itemized tax summaries"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportBills}
              disabled={filtered.length === 0}
            >
              Export Bills CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportTaxSummary}
              disabled={filtered.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              Download Tax Summary (CSV)
            </Button>
          </div>
        }
      />

      {/* Filter & View Mode Toggle Bar */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Report View:</span>
            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("bills")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  viewMode === "bills"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Bills View ({filtered.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("tax")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  viewMode === "tax"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Tax Summary View ({taxRows.length} items)
              </button>
            </div>
          </div>

          {/* Quick Clear Filters */}
          {(dateFrom || dateTo || category || minAmount) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setCategory("");
                setMinAmount("");
              }}
              className="text-xs text-summit-700 hover:text-summit-800 font-medium underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="From date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input label="To date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: "", label: "All Categories" },
              ...CATEGORIES.map((c) => ({ value: c.name, label: c.name })),
            ]}
          />
          <Input label="Min bill amount (₹)" type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
        </div>
      </div>

      {/* ── VIEW 1: BILLS VIEW ── */}
      {viewMode === "bills" && (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-stone-100 text-left text-stone-600">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Bill #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items Sold</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((s) => (
                <Fragment key={s.id}>
                  <tr
                    className="cursor-pointer hover:bg-stone-50 transition-colors"
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  >
                    <td className="px-4 py-3 text-stone-400 font-bold text-center">{expanded === s.id ? "▼" : "▶"}</td>
                    <td className="px-4 py-3 font-semibold text-summit-700">{s.billNumber}</td>
                    <td className="px-4 py-3 text-stone-700">
                      {format(new Date(s.createdAt), "dd MMM yyyy, hh:mm a")}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">{s.customerName}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-stone-500">
                      {itemsSummary(s)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-stone-900">₹{s.grandTotal.toLocaleString("en-IN")}</td>
                  </tr>
                  {expanded === s.id && (
                    <tr>
                      <td colSpan={6} className="bg-stone-50/80 px-8 py-4 border-y border-stone-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Line Items Detail:</span>
                          <span className="text-xs text-stone-500">Customer Phone: {s.customerPhone}</span>
                        </div>
                        <table className="w-full text-xs bg-white rounded-lg border border-stone-200 overflow-hidden shadow-2xs">
                          <thead className="bg-stone-100/70 text-stone-600">
                            <tr>
                              <th className="text-left py-2 px-3">Item Description</th>
                              <th className="text-left py-2 px-3">Subcategory</th>
                              <th className="text-center py-2 px-3">Qty</th>
                              <th className="text-center py-2 px-3">Price / pc</th>
                              <th className="text-right py-2 px-3">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {s.items.map((item) => (
                              <tr key={item.id} className="hover:bg-stone-50">
                                <td className="py-2 px-3 font-medium text-stone-900">{item.name}</td>
                                <td className="py-2 px-3 text-stone-500">{item.subcategory}</td>
                                <td className="text-center py-2 px-3 font-semibold">{item.quantity}</td>
                                <td className="text-center py-2 px-3">₹{item.unitPrice}</td>
                                <td className="text-right py-2 px-3 font-bold text-stone-850">₹{item.lineTotal}</td>
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
            <p className="py-12 text-center text-stone-500 font-medium">No sales match current filters.</p>
          )}
        </div>
      )}

      {/* ── VIEW 2: TAX SUMMARY VIEW (MATCHING USER SPREADSHEET EXACTLY) ── */}
      {viewMode === "tax" && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">Total Qty Sold</span>
              <p className="text-xl font-bold text-stone-900 mt-1">{totalTaxUnits.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">Base Value (Excl. Tax)</span>
              <p className="text-xl font-bold text-stone-900 mt-1">₹{totalTaxBase.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
            </div>
            <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
              <span className="text-xs text-emerald-700 font-medium">Total Tax (GST)</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">₹{totalTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <span className="text-xs text-stone-500 font-medium">Total Value (Incl. Tax)</span>
              <p className="text-xl font-bold text-summit-700 mt-1">₹{totalTaxGross.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 text-left text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description of Goods</th>
                  <th className="px-4 py-3 text-center">Quantity</th>
                  <th className="px-4 py-3 text-right">Price per pc</th>
                  <th className="px-4 py-3 text-center">HSN</th>
                  <th className="px-4 py-3 text-center">GST %</th>
                  <th className="px-4 py-3 text-right">Total Value inclusive of tax</th>
                  <th className="px-4 py-3 text-right">Base Value</th>
                  <th className="px-4 py-3 text-right">Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {taxRows.map((row, idx) => (
                  <tr key={`${row.billNumber}-${idx}`} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-2.5 text-stone-800 font-medium whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-2.5 font-semibold text-stone-900">{row.description}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-stone-800">{row.quantity}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-stone-800">₹{row.pricePerPc}</td>
                    <td className="px-4 py-2.5 text-center text-xs font-mono text-stone-600">{row.hsn}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-stone-700">{row.gstPercentage}%</td>
                    <td className="px-4 py-2.5 text-right font-bold text-stone-900">₹{row.totalValue.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-stone-700">₹{row.baseValue.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-700">₹{row.tax.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
              {taxRows.length > 0 && (
                <tfoot className="bg-stone-100/90 font-bold border-t-2 border-stone-300 text-stone-900">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider text-xs">Total Summary</td>
                    <td className="px-4 py-3 text-center text-stone-900">{totalTaxUnits}</td>
                    <td colSpan={3}></td>
                    <td className="px-4 py-3 text-right text-summit-800">₹{totalTaxGross.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">₹{totalTaxBase.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">₹{totalTaxAmount.toFixed(1)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {taxRows.length === 0 && (
              <p className="py-12 text-center text-stone-500 font-medium">No sales items match current filters.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
