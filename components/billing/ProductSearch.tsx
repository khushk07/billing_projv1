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
  variant?: string;
  source: "catalogue" | "stocklog";
  sourceId: string;
  hsnCode?: string;
  gstPercentage?: number;
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

  // Group search results by Model Name for clean display
  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const map = new Map<string, {
      id: string;
      name: string;
      category: string;
      subcategory: string;
      price: number;
      source: "catalogue" | "stocklog";
      sourceId: string;
      hsnCode?: string;
      gstPercentage?: number;
      defaultSize?: string;
      defaultColor?: string;
    }>();

    for (const p of catalogue) {
      if (
        p.name.toLowerCase().includes(q) ||
        (p.variant && p.variant.toLowerCase().includes(q)) ||
        p.subcategory.toLowerCase().includes(q)
      ) {
        // Extract base model name without trailing size/color
        const baseName = p.name.replace(/\s*-\s*\d+.*$/i, "").trim();
        if (!map.has(baseName)) {
          map.set(baseName, {
            id: p.id,
            name: baseName,
            category: p.category,
            subcategory: p.subcategory,
            price: p.sellingPrice,
            source: "catalogue",
            sourceId: p.id,
            hsnCode: p.hsnCode,
            gstPercentage: p.gstPercentage,
            defaultSize: p.size,
            defaultColor: p.color,
          });
        }
      }
    }

    return Array.from(map.values()).slice(0, 8);
  }, [query, catalogue]);

  useEffect(() => {
    setHighlight(0);
    setShowQuickAdd(query.trim().length > 0 && searchResults.length === 0);
  }, [query, searchResults.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addProductToBill = (item: {
    name: string;
    category: string;
    subcategory: string;
    price: number;
    source: "catalogue" | "stocklog";
    sourceId: string;
    hsnCode?: string;
    gstPercentage?: number;
    defaultSize?: string;
    defaultColor?: string;
  }) => {
    onAddItem({
      id: uuidv4(),
      name: item.name,
      size: item.defaultSize || "30\"",
      color: item.defaultColor || "Black",
      variant: item.defaultSize || undefined,
      subcategory: item.subcategory,
      category: item.category,
      quantity: 1,
      unitPrice: item.price,
      lineTotal: item.price,
      source: item.source,
      sourceId: item.sourceId,
      hsnCode: item.hsnCode,
      gstPercentage: item.gstPercentage,
    });
    setQuery("");
    setOpen(false);
  };

  const handleQuickAdd = async (item: QuickAddResult) => {
    const sourceId = await onQuickAddSave(item);
    onAddItem({
      id: uuidv4(),
      name: item.name,
      size: item.size || undefined,
      color: item.color || undefined,
      variant: item.size || undefined,
      subcategory: item.subcategory,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.price * item.quantity,
      source: "quick",
      sourceId,
      gstPercentage: item.gstPercentage,
      hsnCode: item.hsnCode,
    });
    setShowQuickAdd(false);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        label="Search products"
        placeholder="Type model name (e.g. Discovery, Phantom, Tactical, Tshirt)..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim() && searchResults.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-xl max-h-80 overflow-y-auto divide-y divide-stone-100">
          {searchResults.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 px-4 hover:bg-stone-50 transition-colors cursor-pointer"
              onClick={() => addProductToBill(item)}
            >
              <div>
                <span className="font-bold text-stone-900 text-base">{item.name}</span>
                <span className="ml-2.5 text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                  {item.subcategory}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-stone-900 text-sm">₹{item.price}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addProductToBill(item);
                  }}
                  className="rounded-md bg-summit-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-summit-700 active:bg-summit-800 transition-colors shadow-xs"
                >
                  + Add to Bill
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end p-2 bg-stone-50 border-t border-stone-100">
            <button
              type="button"
              className="px-3 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 focus:outline-none"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
            >
              Cancel / Close Search
            </button>
          </div>
        </div>
      )}

      {showQuickAdd && query.trim() && (
        <div className="mt-3" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
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
  );
}

