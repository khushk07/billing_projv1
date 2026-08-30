"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
  categoryFilter: string;
  subcategoryFilter: string;
  searchFilter?: string;
  stockStatusFilter?: string;
  onEdit: (product: Product) => void;
  onRestock: (product: Product) => void;
  onDelete: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onQuickStockChange?: (product: Product, newQuantity: number) => Promise<void>;
}

function stockBadge(product: Product) {
  if (product.stockQuantity === 0) return <Badge variant="danger">Out of stock</Badge>;
  if (product.stockQuantity <= product.lowStockThreshold)
    return <Badge variant="warning">Low stock</Badge>;
  return null;
}

export function ProductTable({
  products,
  categoryFilter,
  subcategoryFilter,
  searchFilter = "",
  stockStatusFilter = "all",
  onEdit,
  onRestock,
  onDelete,
  onDuplicate,
  onQuickStockChange,
}: ProductTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (subcategoryFilter && p.subcategory !== subcategoryFilter) return false;

    // Search filter across name, size, color, subcategory
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSize = (p.size || p.variant || "").toLowerCase().includes(q);
      const matchColor = (p.color || "").toLowerCase().includes(q);
      const matchSub = p.subcategory.toLowerCase().includes(q);
      if (!matchName && !matchSize && !matchColor && !matchSub) return false;
    }

    // Stock Status filter
    if (stockStatusFilter === "in_stock" && p.stockQuantity === 0) return false;
    if (stockStatusFilter === "low_stock" && (p.stockQuantity === 0 || p.stockQuantity > p.lowStockThreshold)) return false;
    if (stockStatusFilter === "out_of_stock" && p.stockQuantity > 0) return false;

    return true;
  });

  const handleStockDelta = async (product: Product, delta: number) => {
    if (!onQuickStockChange || updatingId) return;
    const nextQty = Math.max(0, product.stockQuantity + delta);
    setUpdatingId(product.id);
    try {
      await onQuickStockChange(product, nextQty);
    } finally {
      setUpdatingId(null);
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center rounded-lg border border-dashed border-stone-300 bg-stone-50">
        <p className="text-stone-600 font-medium">No matching products found.</p>
        <p className="text-xs text-stone-400 mt-1">Try clearing or adjusting your search & filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-xs">
      <table className="w-full text-sm">
        <thead className="bg-stone-100 text-left text-stone-600">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Subcategory</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Colour</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Stock Qty</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {filtered.map((p) => (
            <tr key={p.id} className="hover:bg-stone-50 transition-colors">
              <td className="px-4 py-3 font-medium text-stone-900">
                {p.name}
                <div className="mt-1">{stockBadge(p)}</div>
              </td>
              <td className="px-4 py-3 text-stone-600">{p.category}</td>
              <td className="px-4 py-3 text-stone-600">
                <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-xs">
                  {p.subcategory}
                </span>
              </td>
              <td className="px-4 py-3">
                {p.size || p.variant ? (
                  <Badge variant="default" className="bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5">
                    {p.size || p.variant}
                  </Badge>
                ) : (
                  <span className="text-stone-400 font-normal">N/A</span>
                )}
              </td>
              <td className="px-4 py-3">
                {p.color ? (
                  <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-800 border border-stone-300">
                    {p.color}
                  </span>
                ) : (
                  <span className="text-stone-400 font-normal">N/A</span>
                )}
              </td>
              <td className="px-4 py-3 font-semibold text-stone-900">₹{p.sellingPrice}</td>
              
              {/* Quick stock adjustment controls */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={updatingId === p.id || p.stockQuantity <= 0}
                    onClick={() => handleStockDelta(p, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded border border-stone-300 bg-stone-50 hover:bg-stone-200 active:bg-stone-300 text-xs font-bold text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Quick decrease by 1"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-stone-850">
                    {p.stockQuantity}
                  </span>
                  <button
                    type="button"
                    disabled={updatingId === p.id}
                    onClick={() => handleStockDelta(p, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded border border-stone-300 bg-stone-50 hover:bg-stone-200 active:bg-stone-300 text-xs font-bold text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Quick increase by 1"
                  >
                    +
                  </button>
                </div>
              </td>
              
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => onDuplicate(p)}>Duplicate</Button>
                  <Button size="sm" variant="secondary" onClick={() => onRestock(p)}>Restock</Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(p)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}