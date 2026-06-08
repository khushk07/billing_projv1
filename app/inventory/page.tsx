"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/inventory/ProductForm";
import { ProductTable } from "@/components/inventory/ProductTable";
import { StockLogForm } from "@/components/inventory/StockLogForm";
import { StockLogTable } from "@/components/inventory/StockLogTable";
import { BulkImport } from "@/components/inventory/BulkImport";
import { PromoteModal } from "@/components/inventory/PromoteModal";
import { CATEGORIES, getSubcategories } from "@/lib/categories";
import type { Product, StockLogItem } from "@/types";

export default function InventoryPage() {
  const [tab, setTab] = useState("catalogue");
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLog, setStockLog] = useState<StockLogItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [promoteEntry, setPromoteEntry] = useState<StockLogItem | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/inventory");
    const json = await res.json();
    if (json.success) setProducts(json.data);
  }, []);

  const loadStockLog = useCallback(async () => {
    const res = await fetch("/api/stocklog");
    const json = await res.json();
    if (json.success) setStockLog(json.data);
  }, []);

  useEffect(() => {
    loadProducts();
    loadStockLog();
  }, [loadProducts, loadStockLog]);

  const handleAddProduct = async (data: Record<string, unknown>) => {
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAddProduct(false);
    loadProducts();
  };

  const handleUpdateProduct = async (data: Record<string, unknown>) => {
    if (!editProduct) return;
    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editProduct.id, ...data }),
    });
    setEditProduct(null);
    loadProducts();
  };

  const handleRestock = async () => {
    if (!restockProduct) return;
    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: restockProduct.id,
        action: "restock",
        quantityToAdd: Number(restockQty),
      }),
    });
    setRestockProduct(null);
    setRestockQty("");
    loadProducts();
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    await fetch(`/api/inventory?id=${p.id}`, { method: "DELETE" });
    loadProducts();
  };

  const handlePromoted = async (
    data: Record<string, unknown>,
    stockLogId: string
  ) => {
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetch("/api/stocklog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: stockLogId, action: "promote" }),
    });
    loadProducts();
    loadStockLog();
  };

  const tabs = [
    { id: "catalogue", label: "Product Catalogue" },
    { id: "stocklog", label: "Stock Log" },
  ];

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Manage catalogue and quick stock log" />
      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "catalogue" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Select
                label="Category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubcategoryFilter("");
                }}
                options={[
                  { value: "", label: "All" },
                  ...CATEGORIES.map((c) => ({ value: c.name, label: c.name })),
                ]}
              />
              <Select
                label="Subcategory"
                value={subcategoryFilter}
                onChange={(e) => setSubcategoryFilter(e.target.value)}
                options={[
                  { value: "", label: "All" },
                  ...getSubcategories(categoryFilter).map((s) => ({
                    value: s,
                    label: s,
                  })),
                ]}
                disabled={!categoryFilter}
              />
              <div className="flex items-end">
                <Button onClick={() => setShowAddProduct(true)}>Add Product</Button>
              </div>
            </div>
            <ProductTable
              products={products}
              categoryFilter={categoryFilter}
              subcategoryFilter={subcategoryFilter}
              onEdit={setEditProduct}
              onRestock={setRestockProduct}
              onDelete={handleDelete}
            />
          </div>
        )}

        {tab === "stocklog" && (
          <div className="space-y-6">
            <StockLogForm
              onSubmit={async (data) => {
                await fetch("/api/stocklog", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });
                loadStockLog();
              }}
            />
            <BulkImport
              onImport={async (lines) => {
                await fetch("/api/stocklog", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "bulk-import", lines }),
                });
                loadStockLog();
              }}
            />
            <StockLogTable
              entries={stockLog}
              onPromote={setPromoteEntry}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        title="Add Product"
        wide
      >
        <ProductForm onSubmit={handleAddProduct} onCancel={() => setShowAddProduct(false)} />
      </Modal>

      <Modal
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        title="Edit Product"
        wide
      >
        {editProduct && (
          <ProductForm
            initialData={editProduct}
            onSubmit={handleUpdateProduct}
            onCancel={() => setEditProduct(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!restockProduct}
        onClose={() => setRestockProduct(null)}
        title={`Restock: ${restockProduct?.name}`}
      >
        <Input
          label="Quantity to add"
          type="number"
          min="1"
          value={restockQty}
          onChange={(e) => setRestockQty(e.target.value)}
        />
        <div className="mt-4 flex gap-2">
          <Button onClick={handleRestock}>Add Stock</Button>
          <Button variant="secondary" onClick={() => setRestockProduct(null)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <PromoteModal
        entry={promoteEntry}
        isOpen={!!promoteEntry}
        onClose={() => setPromoteEntry(null)}
        onPromoted={handlePromoted}
      />
    </div>
  );
}