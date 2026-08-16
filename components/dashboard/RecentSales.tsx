import { format } from "date-fns";
import type { Sale } from "@/types";

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  if (sales.length === 0) {
    return <p className="text-sm text-stone-500">No sales yet today.</p>;
  }

  return (
    <ul className="divide-y divide-stone-100">
      {sales.map((s) => (
        <li key={s.id} className="flex justify-between py-2 text-sm">
          <div>
            <span className="font-medium">{s.billNumber}</span>
            <span className="ml-2 text-stone-500">{s.customerName}</span>
          </div>
          <div className="text-right">
            <span className="font-medium">₹{s.grandTotal}</span>
            <p className="text-xs text-stone-400">
              {format(new Date(s.createdAt), "dd MMM, hh:mm a")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
