"use client";

import { useState, useEffect } from "react";
import {
  CATEGORIES,
  getSubcategories,
  getSubcategoryRules,
  getAutoGst,
  getAutoHsn,
  getAutoPrice,
} from "@/lib/categories";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SizeSelector } from "./SizeSelector";

export interface QuickAddResult {
  name: string;
  category: string;
  subcategory: string;
  price: number;
  quantity: number;
  gstPercentage: number;
  hsnCode?: string;
  size?: string;
  variant?: string;
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
  const [category, setCategory] = useState("Hiking Gears");
  const [subcategory, setSubcategory] = useState("Hiking Pants");
  const [model, setModel] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [gstPercentage, setGstPercentage] = useState("5");
  const [hsnCode, setHsnCode] = useState("620319");

  const rules = getSubcategoryRules(category, subcategory);

  useEffect(() => {
    if (category && !getSubcategories(category).includes(subcategory)) {
      setSubcategory("");
    }
  }, [category, subcategory]);

  useEffect(() => {
    if (!category || !subcategory) return;

    const autoGst = getAutoGst(category, subcategory);
    if (autoGst !== undefined) {
      setGstPercentage(String(autoGst));
    }

    const autoHsn = getAutoHsn(category, subcategory, Number(price) || 0);
    if (autoHsn) {
      setHsnCode(autoHsn);
    }
  }, [category, subcategory, price]);

  useEffect(() => {
    if (model && size) {
      setName(`${model} - ${size}`);
      const calculatedPrice = getAutoPrice(category, subcategory, model, size);
      if (calculatedPrice !== undefined) {
        setPrice(String(calculatedPrice));
      }
    } else if (model) {
      setName(model);
    }
  }, [category, subcategory, model, size]);

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="mb-2 text-sm font-medium text-amber-900">Add as quick item</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
          placeholder="Select Category"
        />
        <Select
          label="Subcategory"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          options={getSubcategories(category).map((s) => ({ value: s, label: s }))}
          placeholder="Select Subcategory"
          disabled={!category}
        />

        {rules.models && rules.models.length > 0 ? (
          <div className="col-span-2">
            <Select
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              options={rules.models.map((m) => ({ value: m, label: m }))}
              placeholder="Select Model"
            />
            {model && (
              <SizeSelector
                category={category}
                subcategory={subcategory}
                model={model}
                selectedSize={size}
                onSelectSize={(selectedSz, calculatedPrice) => {
                  setSize(selectedSz);
                  setName(`${model} - ${selectedSz}`);
                  if (calculatedPrice) setPrice(String(calculatedPrice));
                }}
              />
            )}
          </div>
        ) : null}

        <Input label="Item Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Size / Variant (Optional)"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="e.g. N/A, UK 8, S, M, L (leave blank if none)"
        />
        <Input label="Price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input label="HSN Code" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="e.g. 620319" />
        <Select
          label="GST Percentage"
          value={gstPercentage}
          onChange={(e) => setGstPercentage(e.target.value)}
          options={[
            { value: "0", label: "None (0%)" },
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
              name: name || (model ? `${model}${size ? " - " + size : ""}` : "Unnamed Item"),
              category,
              subcategory,
              price: Number(price),
              quantity: Number(quantity) || 1,
              gstPercentage: Number(gstPercentage),
              hsnCode: hsnCode || undefined,
              size: size || undefined,
              variant: size || undefined,
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

