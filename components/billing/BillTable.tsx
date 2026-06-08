"use client";

import { Button } from "@/components/ui/Button";
import type { BillLine } from "@/types";

interface BillTableProps {
  items: BillLine[];
  onUpdateQty: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function BillTable({ items, onUpdateQty, onRemove }: BillTableProps) {
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
                <input
                  type="number"
                  min={1}
                  className="w-16 rounded border px-2 py-1"
                  value={item.quantity === 0 ? "" : item.quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      onUpdateQty(item.id, 0); // Allow typing by representing empty value as 0
                    } else {
                      const num = parseInt(val, 10);
                      onUpdateQty(item.id, isNaN(num) ? 1 : num);
                    }
                  }}
                  onBlur={(e) => {
                    if (item.quantity === 0) {
                      onUpdateQty(item.id, 1);
                    }
                  }}
                />
              </td>
              <td className="px-4 py-3">₹{item.unitPrice}</td>
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
            <td colSpan={4} className="px-4 py-3 text-right">
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
