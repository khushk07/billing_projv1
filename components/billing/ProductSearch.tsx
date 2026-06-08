"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { QuickAddForm, QuickAddResult } from "./QuickAddForm";
import type { Product, StockLogItem, BillLine } from "@/types";

interface SearchResult {
  id: string;
  name: string;
  subcategory: string;
  category: string;
  price: number;
  stock?: number;
  source: "catalogue" | "stocklog";
  sourceId: string;
}

interface ProductSearchProps {
  catalogue: Product[];
  stockLog: StockLogItem[];
  onAddItem: (line: BillLine) => void;
  onQuickAddSave: (item: QuickAddResult) => Promise<string | undefined>;
}

export function ProductSearch({
  catalogue,
  stockLog,
  onAddItem,
  onQuickAddSave,
}: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const results: SearchResult[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const catResults: SearchResult[] = catalogue
      .filter((p) => p.name.toLowerCase().includes(q))
      .map((p) => ({
        id: `cat-${p.id}`,
        name: p.name,
        subcategory: p.subcategory,
        category: p.category,
        price: p.sellingPrice,
        stock: p.stockQuantity,
        source: "catalogue" as const,
        sourceId: p.id,
      }));
    const logResults: SearchResult[] = stockLog
      .filter((e) => e.name.toLowerCase().includes(q))
      .map((e) => ({
        id: `log-${e.id}`,
        name: e.name,
        subcategory: e.subcategory,
        category: e.category,
        price: e.lastUsedPrice || e.approxPrice,
        stock: e.quantity,
        source: "stocklog" as const,
        sourceId: e.id,
      }));
    return [...catResults, ...logResults].slice(0, 12);
  }, [query, catalogue, stockLog]);

  useEffect(() => {
    setHighlight(0);
    setShowQuickAdd(query.trim().length > 0 && results.length === 0);
  }, [query, results.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addResult = (r: SearchResult) => {
    const qty = qtyMap[r.id] ?? 1;
    onAddItem({
      id: uuidv4(),
      name: r.name,
      subcategory: r.subcategory,
      category: r.category,
      quantity: qty,
      unitPrice: r.price,
      lineTotal: r.price * qty,
      source: r.source,
      sourceId: r.sourceId,
    });
    setQuery("");
    setOpen(false);
  };

  const handleQuickAdd = async (item: QuickAddResult) => {
    const sourceId = await onQuickAddSave(item);
    onAddItem({
      id: uuidv4(),
      name: item.name,
      subcategory: item.subcategory,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.price * item.quantity,
      source: "quick",
      sourceId,
    });
    setShowQuickAdd(false);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && e.key !== "ArrowDown") return;
    const total = results.length + (showQuickAdd ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (highlight < results.length) addResult(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        label="Search products"
        placeholder="Type product name..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && query.trim() && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg">
          {results.map((r, i) => (
            <div
              key={r.id}
              className={`flex min-h-[52px] cursor-pointer items-center justify-between gap-2 border-b border-stone-100 px-3 py-3 last:border-0 active:bg-summit-100 ${
                i === highlight ? "bg-summit-50" : "hover:bg-stone-50"
              }`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => addResult(r)}
            >
              <div>
                <span className="font-medium">{r.name}</span>
                <span className="ml-2 text-xs text-stone-500">{r.subcategory}</span>
                <div className="mt-0.5 flex gap-1">
                  <Badge variant={r.source === "catalogue" ? "catalogue" : "stocklog"}>
                    {r.source === "catalogue" ? "Catalogue" : "Stock Log"}
                  </Badge>
                  {r.stock !== undefined && (
                    <span className="text-xs text-stone-500">Stock: {r.stock}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  className="w-14 rounded border px-1 py-0.5 text-sm"
                  value={qtyMap[r.id] ?? 1}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setQtyMap((m) => ({ ...m, [r.id]: Number(e.target.value) || 1 }))
                  }
                />
                <span className="font-medium">₹{r.price}</span>
              </div>
            </div>
          ))}
          {showQuickAdd && (
            <div className="p-2">
              <QuickAddForm
                searchQuery={query}
                onAdd={handleQuickAdd}
                onCancel={() => {
                  setShowQuickAdd(false);
                  setOpen(false);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
