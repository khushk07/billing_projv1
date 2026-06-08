"use client";

import { useState } from "react";
import { CATEGORIES, getSubcategories } from "@/lib/categories";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface StockLogFormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

export function StockLogForm({ onSubmit }: StockLogFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [approxPrice, setApproxPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name,
        category,
        subcategory,
        approxPrice: Number(approxPrice),
        quantity: Number(quantity),
        source: "manual",
      });
      setName("");
      setApproxPrice("");
      setQuantity("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
        placeholder="Select"
        required
      />
      <Select
        label="Subcategory"
        value={subcategory}
        onChange={(e) => setSubcategory(e.target.value)}
        options={getSubcategories(category).map((s) => ({ value: s, label: s }))}
        placeholder="Select"
        required
        disabled={!category}
      />
      <Input label="Approx Price (₹)" type="number" min="0" value={approxPrice} onChange={(e) => setApproxPrice(e.target.value)} required />
      <Input label="Quantity" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      <div className="flex items-end">
        <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Quick Add"}</Button>
      </div>
    </form>
  );
}
