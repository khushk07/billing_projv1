"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerLookup } from "@/components/billing/CustomerLookup";
import { ProductSearch } from "@/components/billing/ProductSearch";
import { BillTable } from "@/components/billing/BillTable";
import { BillSummary } from "@/components/billing/BillSummary";
import { Button } from "@/components/ui/Button";
import { generateAndDownloadBill } from "@/lib/pdfGenerator";
import type { Product, StockLogItem, BillLine, Sale } from "@/types";
import type { QuickAddResult } from "@/components/billing/QuickAddForm";

const STOCK_SYNC_MS = 12_000;

export default function NewSalePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [stockLog, setStockLog] = useState<StockLogItem[]>([]);
  const [items, setItems] = useState<BillLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setSyncing(true);
    try {
      const [invRes, logRes] = await Promise.all([
        fetch("/api/inventory", { cache: "no-store" }),
        fetch("/api/stocklog", { cache: "no-store" }),
      ]);
      const inv = await invRes.json();
      const log = await logRes.json();
      if (inv.success) setCatalogue(inv.data);
      if (log.success) setStockLog(log.data);
      setLastSynced(new Date());
    } finally {
      if (!quiet) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), STOCK_SYNC_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") loadData(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadData]);

  useEffect(() => {
    const checkPhone = async () => {
      if (phone.length !== 10) {
        setIsReturning(false);
        return;
      }
      const res = await fetch(`/api/customers?phone=${phone}`);
      const json = await res.json();
      if (json.success && json.data) {
        setIsReturning(true);
        setName(json.data.name);
      } else {
        setIsReturning(false);
      }
    };
    const t = setTimeout(checkPhone, 300);
    return () => clearTimeout(t);
  }, [phone]);

  const addItem = (line: BillLine) => {
    setItems((prev) => [...prev, line]);
  };

  const updateQty = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, quantity, lineTotal: i.unitPrice * quantity }
          : i
      )
    );
  };

  const updateGst = (id: string, gstPercentage: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, gstPercentage }
          : i
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleQuickAddSave = async (item: QuickAddResult) => {
    const res = await fetch("/api/stocklog/quick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const json = await res.json();
    await loadData(true);
    return json.data?.id as string | undefined;
  };

  const resetBill = () => {
    setName("");
    setPhone("");
    setItems([]);
    setIsReturning(false);
    loadData(true);
  };

  const handleComplete = async () => {
    if (phone.length !== 10 || !name.trim() || items.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          items,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error ?? "Failed to complete sale");
        return;
      }
      const sale = json.data as Sale;
      await generateAndDownloadBill({
        billNumber: sale.billNumber,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        items: sale.items,
        grandTotal: sale.grandTotal,
        createdAt: sale.createdAt,
      });
      window.open(`https://wa.me/91${sale.customerPhone}`, "_blank");
      resetBill();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-billing-safe lg:pb-0">
      <PageHeader
        title="New Sale"
        subtitle="Search products, complete sale, send bill on WhatsApp"
        action={
          <div className="flex flex-col items-end gap-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => loadData()}
              disabled={syncing}
            >
              {syncing ? "Syncing…" : "Refresh stock"}
            </Button>
            {lastSynced && (
              <span className="text-xs text-stone-500">
                Stock synced {format(lastSynced, "HH:mm:ss")}
              </span>
            )}
          </div>
        }
      />
      <p className="rounded-lg bg-summit-50 px-3 py-2 text-xs text-summit-800 lg:hidden">
        Stock auto-refreshes every 12s so all billing devices stay in sync.
      </p>
      <CustomerLookup
        name={name}
        phone={phone}
        onNameChange={setName}
        onPhoneChange={setPhone}
        isReturning={isReturning}
      />
      <ProductSearch
        catalogue={catalogue}
        stockLog={stockLog}
        onAddItem={addItem}
        onQuickAddSave={handleQuickAddSave}
      />
      <BillTable items={items} onUpdateQty={updateQty} onUpdateGst={updateGst} onRemove={removeItem} />
      <div className="hidden lg:block">
        <BillSummary
          items={items}
          onComplete={handleComplete}
          isSubmitting={isSubmitting}
          disabled={phone.length !== 10 || !name.trim()}
        />
      </div>
      <div className="lg:hidden">
        <BillSummary
          sticky
          items={items}
          onComplete={handleComplete}
          isSubmitting={isSubmitting}
          disabled={phone.length !== 10 || !name.trim()}
        />
      </div>
    </div>
  );
}
