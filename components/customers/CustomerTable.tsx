"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import type { Customer } from "@/types";

interface CustomerTableProps {
  customers: Customer[];
  search: string;
  onRowClick: (customer: Customer) => void;
  onExport: () => void;
}

export function CustomerTable({
  customers,
  search,
  onRowClick,
  onExport,
}: CustomerTableProps) {
  const q = search.toLowerCase().trim();
  const filtered = customers.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q)
  );

  const topCategory = (c: Customer) =>
    c.categoriesBought[c.categoriesBought.length - 1] ?? "—";

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="secondary" size="sm" onClick={onExport}>
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-left text-stone-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Visits</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Last Purchase</th>
              <th className="px-4 py-3">Top Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer hover:bg-summit-50"
                onClick={() => onRowClick(c)}
              >
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3">{c.totalVisits}</td>
                <td className="px-4 py-3">₹{c.totalSpent}</td>
                <td className="px-4 py-3">
                  {format(new Date(c.lastPurchaseDate), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-3">{topCategory(c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-stone-500">No customers found.</p>
        )}
      </div>
    </div>
  );
}
