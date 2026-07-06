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
  gstPercentage: number;
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
  const [gstPercentage, setGstPercentage] = useState("0");

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
        <Select
          label="GST Percentage"
          value={gstPercentage}
          onChange={(e) => setGstPercentage(e.target.value)}
          options={[
            { value: "0", label: "None" },
            { value: "5", label: "5%" },
            { value: "12", label: "12%" },
            { value: "18", label: "18%" },
            { value: "28", label: "28%" },
          ]}
        />
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-stone-700">Qty</label>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-stone-300 bg-white hover:bg-stone-100 active:bg-stone-200 font-bold text-stone-600 focus:outline-none"
              onClick={() => setQuantity((q) => String(Math.max(1, (Number(q) || 1) - 1)))}
            >
              -
            </button>
            <span className="w-10 text-center font-semibold text-stone-850">
              {quantity}
            </span>
            <button
              type="button"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-stone-300 bg-white hover:bg-stone-100 active:bg-stone-200 font-bold text-stone-600 focus:outline-none"
              onClick={() => setQuantity((q) => String((Number(q) || 1) + 1))}
            >
              +
            </button>
          </div>
        </div>
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
              gstPercentage: Number(gstPercentage),
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
