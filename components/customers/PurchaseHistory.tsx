"use client";

import { format } from "date-fns";
import type { Sale } from "@/types";

interface PurchaseHistoryProps {
  sales: Sale[];
}

export function PurchaseHistory({ sales }: PurchaseHistoryProps) {
  if (sales.length === 0) {
    return <p className="text-stone-500">No purchase history.</p>;
  }

  return (
    <div className="space-y-4">
      {sales.map((sale) => (
        <div
          key={sale.id}
          className="rounded-lg border border-stone-200 bg-white p-4"
        >
          <div className="mb-2 flex justify-between">
            <span className="font-semibold">{sale.billNumber}</span>
            <span className="text-sm text-stone-500">
              {format(new Date(sale.createdAt), "dd MMM yyyy, hh:mm a")}
            </span>
          </div>
          <ul className="mb-2 text-sm text-stone-600">
            {sale.items.map((item) => (
              <li key={item.id}>
                {item.name} × {item.quantity} — ₹{item.lineTotal}
              </li>
            ))}
          </ul>
          <p className="font-bold text-summit-700">Total: ₹{sale.grandTotal}</p>
        </div>
      ))}
    </div>
  );
}
