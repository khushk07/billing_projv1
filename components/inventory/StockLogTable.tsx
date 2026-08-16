"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { StockLogItem } from "@/types";

interface StockLogTableProps {
  entries: StockLogItem[];
  onPromote: (entry: StockLogItem) => void;
}

export function StockLogTable({ entries, onPromote }: StockLogTableProps) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-stone-500">No active stock log entries.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200">
      <table className="w-full text-sm">
        <thead className="bg-stone-100 text-left text-stone-600">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Subcategory</th>
            <th className="px-4 py-3">Approx Price</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Used</th>
            <th className="px-4 py-3">Last Price</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {entries.map((e) => (
            <tr key={e.id} className="hover:bg-stone-50">
              <td className="px-4 py-3 font-medium">{e.name}</td>
              <td className="px-4 py-3">{e.category}</td>
              <td className="px-4 py-3">{e.subcategory}</td>
              <td className="px-4 py-3">₹{e.approxPrice}</td>
              <td className="px-4 py-3">{e.quantity}</td>
              <td className="px-4 py-3">
                <Badge variant="default">{e.timesUsed}×</Badge>
              </td>
              <td className="px-4 py-3">₹{e.lastUsedPrice}</td>
              <td className="px-4 py-3">
                <Badge variant="stocklog">{e.source}</Badge>
              </td>
              <td className="px-4 py-3">
                <Button size="sm" variant="secondary" onClick={() => onPromote(e)}>
                  Promote
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}