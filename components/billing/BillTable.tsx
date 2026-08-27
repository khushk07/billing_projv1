"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getSubcategoryRules } from "@/lib/categories";
import type { BillLine } from "@/types";

interface BillTableProps {
  items: BillLine[];
  onUpdateQty: (id: string, quantity: number) => void;
  onUpdateGst: (id: string, gstPercentage: number) => void;
  onUpdateHsn: (id: string, hsnCode: string) => void;
  onUpdateSize?: (id: string, size: string) => void;
  onUpdateColor?: (id: string, color: string) => void;
  onRemove: (id: string) => void;
}

const DEFAULT_SIZES = [
  "N/A",
  '24"',
  '26"',
  '28"',
  '30"',
  '32"',
  '34"',
  '36"',
  '38"',
  '40"',
  '42"',
  '44"',
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "UK 6",
  "UK 7",
  "UK 8",
  "UK 9",
  "UK 10",
  "UK 11",
  "UK 12",
];

const DEFAULT_COLOURS = [
  "N/A",
  "Black",
  "Green",
  "Grey",
  "Blue",
  "Red",
  "Navy",
  "Olive",
  "Brown",
  "Yellow",
  "White",
  "Orange",
  "Beige",
  "Pink",
];

export function BillTable({
  items,
  onUpdateQty,
  onUpdateGst,
  onUpdateHsn,
  onUpdateSize,
  onUpdateColor,
  onRemove,
}: BillTableProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-stone-500">No items in bill yet. Search to add products.</p>
    );
  }

  const grandTotal = items.reduce((s, i) => s + i.lineTotal, 0);

  return (
    <div className="rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-100 text-left text-stone-600">
          <tr>
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Colour</th>
            <th className="px-4 py-3">Subcategory</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">HSN Code</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">GST %</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {items.map((item) => {
            const rules = getSubcategoryRules(item.category, item.subcategory);
            const sizeOptions = Array.from(new Set([...(rules.sizes ?? []), ...DEFAULT_SIZES]));
            const currentSize = item.size || item.variant || "N/A";
            const currentColor = item.color || "N/A";

            return (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                
                {/* Size Dropdown */}
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 focus:border-amber-500 focus:outline-none cursor-pointer shadow-xs"
                    value={currentSize}
                    onChange={(e) => onUpdateSize && onUpdateSize(item.id, e.target.value)}
                  >
                    {sizeOptions.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Colour Dropdown */}
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-stone-300 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-800 focus:border-stone-500 focus:outline-none cursor-pointer shadow-xs"
                    value={currentColor}
                    onChange={(e) => onUpdateColor && onUpdateColor(item.id, e.target.value)}
                  >
                    {DEFAULT_COLOURS.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-stone-500">{item.subcategory}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 transition-colors font-semibold text-stone-600 focus:outline-none"
                      onClick={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-semibold text-stone-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 transition-colors font-semibold text-stone-600 focus:outline-none"
                      onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="e.g. 6109"
                    className="w-20 rounded border border-stone-300 px-2 py-1 text-xs focus:border-summit-500 focus:outline-none"
                    value={item.hsnCode ?? ""}
                    onChange={(e) => onUpdateHsn(item.id, e.target.value)}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-stone-900">₹{item.unitPrice}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded border border-stone-300 bg-white px-2 py-1 text-xs focus:border-summit-500 focus:outline-none"
                    value={item.gstPercentage ?? 0}
                    onChange={(e) => onUpdateGst(item.id, Number(e.target.value))}
                  >
                    <option value={0}>None</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </td>
                <td className="px-4 py-3 font-bold text-summit-700">₹{item.lineTotal}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" onClick={() => onRemove(item.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-stone-50 font-bold">
            <td colSpan={8} className="px-4 py-3 text-right">
              Grand Total
            </td>
            <td className="px-4 py-3">₹{grandTotal}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

