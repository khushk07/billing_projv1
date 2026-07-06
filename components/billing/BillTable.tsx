"use client";

import { Button } from "@/components/ui/Button";
import type { BillLine } from "@/types";

interface BillTableProps {
  items: BillLine[];
  onUpdateQty: (id: string, quantity: number) => void;
  onUpdateGst: (id: string, gstPercentage: number) => void;
  onRemove: (id: string) => void;
}

export function BillTable({ items, onUpdateQty, onUpdateGst, onRemove }: BillTableProps) {
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
            <th className="px-4 py-3">Subcategory</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">GST %</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-medium">{item.name}</td>
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
              <td className="px-4 py-3">₹{item.unitPrice}</td>
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
              <td className="px-4 py-3 font-medium">₹{item.lineTotal}</td>
              <td className="px-4 py-3">
                <Button size="sm" variant="ghost" onClick={() => onRemove(item.id)}>
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-stone-50 font-bold">
            <td colSpan={5} className="px-4 py-3 text-right">
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
