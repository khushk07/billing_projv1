"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { PurchaseHistory } from "@/components/customers/PurchaseHistory";
import { Button } from "@/components/ui/Button";
import type { Customer, Sale } from "@/types";

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    fetch(`/api/customers/${params.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCustomer(json.data.customer);
          setSales(json.data.sales);
        }
      });
  }, [params.id]);

  if (!customer) {
    return <p className="text-stone-500">Loading...</p>;
  }

  return (
    <div>
      <Link href="/customers">
        <Button variant="ghost" size="sm" className="mb-4">
          ← Back to customers
        </Button>
      </Link>
      <PageHeader
        title={customer.name}
        subtitle={`${customer.phone} · ${customer.totalVisits} visits · ₹${customer.totalSpent} lifetime`}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-stone-500">Last purchase</p>
          <p className="font-semibold">
            {format(new Date(customer.lastPurchaseDate), "dd MMM yyyy")}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-stone-500">Categories bought</p>
          <p className="font-semibold">{customer.categoriesBought.join(", ") || "—"}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-stone-500">Total visits</p>
          <p className="font-semibold">{customer.totalVisits}</p>
        </div>
      </div>
      <h2 className="mb-3 text-lg font-semibold">Purchase History</h2>
      <PurchaseHistory sales={sales} />
    </div>
  );
}
