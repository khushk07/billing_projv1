"use client";

import { getSubcategoryRules, getAutoPrice } from "@/lib/categories";

interface SizeSelectorProps {
  category: string;
  subcategory: string;
  model: string;
  selectedSize?: string;
  onSelectSize: (size: string, price: number) => void;
}

export function SizeSelector({
  category,
  subcategory,
  model,
  selectedSize,
  onSelectSize,
}: SizeSelectorProps) {
  const rules = getSubcategoryRules(category, subcategory);
  const sizes = rules.sizes ?? [];

  if (sizes.length === 0) return null;

  return (
    <div className="my-2">
      <label className="mb-1.5 block text-xs font-semibold text-stone-600 uppercase tracking-wider">
        Select Size (Vertically Scrollable):
      </label>
      <div className="max-h-36 overflow-y-auto p-1.5 border border-stone-200 rounded-lg bg-stone-50/60 grid grid-cols-4 sm:grid-cols-6 gap-1.5">
        {sizes.map((sz) => {
          const isSelected = selectedSize === sz;
          const price = getAutoPrice(category, subcategory, model, sz);

          return (
            <button
              key={sz}
              type="button"
              onClick={() => onSelectSize(sz, price ?? 0)}
              className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs transition-all font-medium ${
                isSelected
                  ? "bg-summit-600 text-white border-summit-700 shadow-sm scale-105"
                  : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100 hover:border-stone-400"
              }`}
            >
              <span className="font-bold text-sm">{sz}</span>
              {price !== undefined && price > 0 && (
                <span
                  className={`text-[10px] ${
                    isSelected ? "text-amber-200 font-semibold" : "text-stone-500"
                  }`}
                >
                  ₹{price}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

