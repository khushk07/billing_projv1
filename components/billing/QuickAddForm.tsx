"use client";

import { useState } from "react";
import { CATEGORIES, getSubcategories } from "@/lib/categories";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export interface QuickAddResult {
  name: string;
  category: string;
  subcategory: string;
  price: number;
  quantity: number;
}

interface QuickAddFormProps {
  searchQuery: string;
  onAdd: (item: QuickAddResult) => void;
  onCancel: () => void;
}

export function QuickAddForm({
  searchQuery,
  onAdd,
  onCancel,
}: QuickAddFormProps) {
  const [name, setName] = useState(searchQuery);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="mb-2 text-sm font-medium text-amber-900">Add as quick item</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
          placeholder="Select"
        />
        <Select
          label="Subcategory"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          options={getSubcategories(category).map((s) => ({ value: s, label: s }))}
          placeholder="Select"
          disabled={!category}
        />
        <Input label="Price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input label="Qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          onClick={() =>
            onAdd({
              name,
              category,
              subcategory,
              price: Number(price),
              quantity: Number(quantity) || 1,
            })
          }
        >
          Add to bill
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
