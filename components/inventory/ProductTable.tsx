"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
  categoryFilter: string;
  subcategoryFilter: string;
  onEdit: (product: Product) => void;
  onRestock: (product: Product) => void;
  onDelete: (product: Product) => void;
  onDuplicate: (product: Product) => void;
}

function stockBadge(product: Product) {
  if (product.stockQuantity === 0) return <Badge variant="danger">Out of stock</Badge>;
  if (product.stockQuantity <= product.lowStockThreshold)
    return <Badge variant="warning">Low stock</Badge>;
  return null;
}

export function ProductTable({
  products,
  categoryFilter,
  subcategoryFilter,
  onEdit,
  onRestock,
  onDelete,
  onDuplicate,
}: ProductTableProps) {
  const filtered = products.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (subcategoryFilter && p.subcategory !== subcategoryFilter) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-stone-500">No products found.</p>
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
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Colour</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {filtered.map((p) => (
            <tr key={p.id} className="hover:bg-stone-50">
              <td className="px-4 py-3 font-medium">
                {p.name}
                <div className="mt-1">{stockBadge(p)}</div>
              </td>
              <td className="px-4 py-3">{p.category}</td>
              <td className="px-4 py-3">{p.subcategory}</td>
              <td className="px-4 py-3">
                {p.size || p.variant ? (
                  <Badge variant="default" className="bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5">
                    {p.size || p.variant}
                  </Badge>
                ) : (
                  <span className="text-stone-400 font-normal">N/A</span>
                )}
              </td>
              <td className="px-4 py-3">
                {p.color ? (
                  <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-800 border border-stone-300">
                    {p.color}
                  </span>
                ) : (
                  <span className="text-stone-400 font-normal">N/A</span>
                )}
              </td>
              <td className="px-4 py-3">₹{p.sellingPrice}</td>
              <td className="px-4 py-3">{p.stockQuantity}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => onDuplicate(p)}>Duplicate</Button>
                  <Button size="sm" variant="secondary" onClick={() => onRestock(p)}>Restock</Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(p)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}