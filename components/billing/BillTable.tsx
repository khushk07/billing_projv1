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
  onRemove: (id: string) => void;
}

export function BillTable({
  items,
  onUpdateQty,
  onUpdateGst,
  onUpdateHsn,
  onUpdateSize,
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
            const availableSizes = rules.sizes ?? [];

            return (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">
                  {availableSizes.length > 0 && onUpdateSize ? (
                    <select
                      className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 focus:border-amber-500 focus:outline-none cursor-pointer"
                      value={item.size || item.variant || ""}
                      onChange={(e) => onUpdateSize(item.id, e.target.value)}
                    >
                      {availableSizes.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  ) : item.size || item.variant ? (
                    <Badge variant="default" className="bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5">
                      {item.size || item.variant}
                    </Badge>
                  ) : (
                    <span className="text-stone-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {item.color ? (
                    <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-800 border border-stone-300">
                      {item.color}
                    </span>
                  ) : (
                    <span className="text-stone-400">-</span>
                  )}
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

