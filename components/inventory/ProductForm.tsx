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
  const [model, setModel] = useState("");
  const [size, setSize] = useState("");
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
  const [hsnCode, setHsnCode] = useState(initialData?.hsnCode ?? "");
  const [gstPercentage, setGstPercentage] = useState(
    String(initialData?.gstPercentage ?? "0")
  );
  const [loading, setLoading] = useState(false);

  const rules = getSubcategoryRules(category, subcategory);

  // Auto-set rules when Category / Subcategory changes
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

    const autoHsn = getAutoHsn(category, subcategory, Number(sellingPrice) || 0);
    if (autoHsn) {
      setHsnCode(autoHsn);
    }
  }, [category, subcategory, sellingPrice]);

  // Auto-set Name and Price when Model & Size are selected
  useEffect(() => {
    if (model && size) {
      setName(`${model} - ${size}`);
      setVariant(size);
      const calculatedPrice = getAutoPrice(category, subcategory, model, size);
      if (calculatedPrice !== undefined) {
        setSellingPrice(String(calculatedPrice));
      }
    } else if (model) {
      setName(model);
    }
  }, [category, subcategory, model, size]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name: name || (model ? `${model}${size ? " - " + size : ""}` : "Unnamed Product"),
        category,
        subcategory,
        variant: variant || size || undefined,
        sellingPrice: Number(sellingPrice),
        stockQuantity: Number(stockQuantity),
        lowStockThreshold: Number(lowStockThreshold),
        hsnCode: hsnCode || undefined,
        gstPercentage: Number(gstPercentage),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* Render Model and Size pickers if rules are configured for this subcategory */}
      {rules.models && rules.models.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
          <Select
            label="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            options={rules.models.map((m) => ({ value: m, label: m }))}
            placeholder="Select Model"
            required
          />
          {rules.sizes && (
            <Select
              label="Size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              options={rules.sizes.map((sz) => ({ value: sz, label: sz }))}
              placeholder="Select Size"
              required
            />
          )}
        </div>
      ) : null}

      <Input
        label="Product Display Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Discovery (Convertible) - 32&quot;"
        required
      />

      <Input
        label="Variant (optional)"
        value={variant}
        onChange={(e) => setVariant(e.target.value)}
        placeholder="e.g. 32&quot; / Black"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Selling Price (₹)"
          type="number"
          min="0"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          required
        />
        <Input
          label="Stock Quantity"
          type="number"
          min="0"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="HSN Code"
          value={hsnCode}
          onChange={(e) => setHsnCode(e.target.value)}
          placeholder="e.g. 620319"
        />
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
      </div>

      <Input
        label="Low Stock Threshold"
        type="number"
        min="0"
        value={lowStockThreshold}
        onChange={(e) => setLowStockThreshold(e.target.value)}
      />

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

