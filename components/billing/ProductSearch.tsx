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
  const groupedModels = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const map = new Map<string, {
      name: string;
      category: string;
      subcategory: string;
      source: "catalogue" | "stocklog";
      sourceId: string;
      hsnCode?: string;
      gstPercentage?: number;
      variants: { size: string; price: number; id: string }[];
    }>();

    for (const p of catalogue) {
      if (
        p.name.toLowerCase().includes(q) ||
        (p.variant && p.variant.toLowerCase().includes(q)) ||
        p.subcategory.toLowerCase().includes(q)
      ) {
        if (!map.has(p.name)) {
          map.set(p.name, {
            name: p.name,
            category: p.category,
            subcategory: p.subcategory,
            source: "catalogue",
            sourceId: p.id,
            hsnCode: p.hsnCode,
            gstPercentage: p.gstPercentage,
            variants: [],
          });
        }
        const item = map.get(p.name)!;
        if (p.variant) {
          item.variants.push({ size: p.variant, price: p.sellingPrice, id: p.id });
        }
      }
    }

    return Array.from(map.values()).slice(0, 8);
  }, [query, catalogue]);

  useEffect(() => {
    setHighlight(0);
    setShowQuickAdd(query.trim().length > 0 && groupedModels.length === 0);
  }, [query, groupedModels.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addModelWithSize = (model: {
    name: string;
    category: string;
    subcategory: string;
    source: "catalogue" | "stocklog";
    sourceId: string;
    hsnCode?: string;
    gstPercentage?: number;
  }, selectedSize: string, price: number) => {
    onAddItem({
      id: uuidv4(),
      name: model.name,
      size: selectedSize,
      variant: selectedSize,
      subcategory: model.subcategory,
      category: model.category,
      quantity: 1,
      unitPrice: price,
      lineTotal: price,
      source: model.source,
      sourceId: model.sourceId,
      hsnCode: model.hsnCode,
      gstPercentage: model.gstPercentage,
    });
    setQuery("");
    setOpen(false);
  };

  const handleQuickAdd = async (item: QuickAddResult) => {
    const sourceId = await onQuickAddSave(item);
    onAddItem({
      id: uuidv4(),
      name: item.name,
      size: undefined,
      variant: undefined,
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
        placeholder="Type model name (e.g. Discovery, Phantom, Tactical)..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim() && groupedModels.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-xl max-h-96 overflow-y-auto p-2 divide-y divide-stone-100">
          {groupedModels.map((m) => (
            <div key={m.name} className="py-2.5 px-3 hover:bg-stone-50/80 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 text-base">{m.name}</span>
                  <span className="ml-2 text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    {m.subcategory}
                  </span>
                </div>
              </div>

              {/* Scrollable Size Menu for Model */}
              <div className="mt-2">
                <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Select Size to Add:
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {m.variants.length > 0 ? (
                    m.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => addModelWithSize(m, v.size, v.price)}
                        className="flex flex-col items-center justify-center min-w-[62px] px-2.5 py-1.5 rounded-md border border-stone-300 bg-white hover:bg-summit-600 hover:text-white hover:border-summit-700 transition-all font-medium text-xs shadow-xs hover:scale-105 group"
                      >
                        <span className="font-bold text-stone-900 group-hover:text-white">{v.size}</span>
                        <span className="text-[10px] text-stone-500 group-hover:text-amber-200 font-semibold">₹{v.price}</span>
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={() => addModelWithSize(m, "-", 1500)}
                      className="px-3 py-1 bg-summit-600 text-white rounded text-xs"
                    >
                      + Add Item
                    </button>
                  )}
                </div>
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

