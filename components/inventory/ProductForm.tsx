"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, getSubcategories } from "@/lib/categories";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types";

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Product",
}: ProductFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [subcategory, setSubcategory] = useState(initialData?.subcategory ?? "");
  const [variant, setVariant] = useState(initialData?.variant ?? "");
  const [sellingPrice, setSellingPrice] = useState(
    String(initialData?.sellingPrice ?? "")
  );
  const [stockQuantity, setStockQuantity] = useState(
    String(initialData?.stockQuantity ?? "")
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(initialData?.lowStockThreshold ?? "5")
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category && !getSubcategories(category).includes(subcategory)) {
      setSubcategory("");
    }
  }, [category, subcategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name,
        category,
        subcategory,
        variant: variant || undefined,
        sellingPrice: Number(sellingPrice),
        stockQuantity: Number(stockQuantity),
        lowStockThreshold: Number(lowStockThreshold),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
        placeholder="Select category"
        required
      />
      <Select
        label="Subcategory"
        value={subcategory}
        onChange={(e) => setSubcategory(e.target.value)}
        options={getSubcategories(category).map((s) => ({ value: s, label: s }))}
        placeholder="Select subcategory"
        required
        disabled={!category}
      />
      <Input label="Variant (optional)" value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="e.g. L / Navy" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Selling Price (₹)" type="number" min="0" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
        <Input label="Stock Quantity" type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required />
      </div>
      <Input label="Low Stock Threshold" type="number" min="0" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : submitLabel}</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
