import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types";

interface LowStockAlertProps {
  products: Product[];
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-stone-500">All stock levels look good.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {products.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-3 py-2"
        >
          <div>
            <span className="font-medium">{p.name}</span>
            <span className="ml-2 text-sm text-stone-500">
              {p.stockQuantity} left
            </span>
            <Badge
              variant={p.stockQuantity === 0 ? "danger" : "warning"}
              className="ml-2"
            >
              {p.stockQuantity === 0 ? "Critical" : "Low"}
            </Badge>
          </div>
          <Link href="/inventory">
            <Button size="sm" variant="secondary">
              Restock
            </Button>
          </Link>
        </li>
      ))}
    </ul>
  );
}
