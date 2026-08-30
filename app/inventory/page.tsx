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
import { downloadCsv, downloadJson } from "@/lib/csvExporter";
import { format } from "date-fns";
import type { Product, StockLogItem } from "@/types";

export default function InventoryPage() {
  const [tab, setTab] = useState("catalogue");
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLog, setStockLog] = useState<StockLogItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [duplicateProduct, setDuplicateProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [promoteEntry, setPromoteEntry] = useState<StockLogItem | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

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

  const handleExportCsv = () => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    downloadCsv(
      `summit-gear-inventory-${dateStr}.csv`,
      ["ID", "Name", "Category", "Subcategory", "Size", "Colour", "Price", "Stock Quantity", "Low Stock Threshold", "HSN Code", "GST %"],
      products.map((p) => [
        p.id,
        p.name,
        p.category,
        p.subcategory,
        p.size || p.variant || "N/A",
        p.color || "N/A",
        p.sellingPrice,
        p.stockQuantity,
        p.lowStockThreshold,
        p.hsnCode || "",
        p.gstPercentage || 0,
      ])
    );
  };

  const handleExportFullBackup = async () => {
    setBackingUp(true);
    try {
      const [invRes, custRes, salesRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/customers"),
        fetch("/api/sales"),
      ]);
      const [invJson, custJson, salesJson] = await Promise.all([
        invRes.json(),
        custRes.json(),
        salesRes.json(),
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        inventory: invJson.data || products,
        customers: custJson.data || [],
        sales: salesJson.data || [],
      };

      const dateStr = format(new Date(), "yyyy-MM-dd_HHmm");
      downloadJson(`summit-gear-full-backup-${dateStr}.json`, backupData);
    } finally {
      setBackingUp(false);
    }
  };

  const handleAddProduct = async (data: Record<string, unknown>) => {
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAddProduct(false);
    loadProducts();
  };

  const handleDuplicateProduct = async (data: Record<string, unknown>) => {
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setDuplicateProduct(null);
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

  const handleQuickStockChange = async (product: Product, newQuantity: number) => {
    // Optimistic UI update for instant feedback
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stockQuantity: newQuantity } : p))
    );

    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, stockQuantity: newQuantity }),
    });
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

  // Quick stats for filter badges
  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.stockQuantity > 0).length;
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Manage catalogue, quick filters and stock levels"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportCsv}
              disabled={products.length === 0}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportFullBackup}
              disabled={backingUp}
              className="border-summit-300 text-summit-700 hover:bg-summit-50"
            >
              {backingUp ? "Generating Backup…" : "Backup All Data (Offline)"}
            </Button>
          </div>
        }
      />
      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "catalogue" && (
          <div className="space-y-5">
            {/* Search & Main Filter Controls */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <div className="grid gap-3 sm:grid-cols-12 items-end">
                {/* Search Bar */}
                <div className="sm:col-span-4">
                  <Input
                    label="Search Products"
                    placeholder="Search by name, model, size (34), or colour..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                </div>

                {/* Category Selector */}
                <div className="sm:col-span-3">
                  <Select
                    label="Category"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setSubcategoryFilter("");
                    }}
                    options={[
                      { value: "", label: "All Categories" },
                      ...CATEGORIES.map((c) => ({ value: c.name, label: c.name })),
                    ]}
                  />
                </div>

                {/* Subcategory Selector */}
                <div className="sm:col-span-3">
                  <Select
                    label="Subcategory"
                    value={subcategoryFilter}
                    onChange={(e) => setSubcategoryFilter(e.target.value)}
                    options={[
                      { value: "", label: "All Subcategories" },
                      ...getSubcategories(categoryFilter).map((s) => ({
                        value: s,
                        label: s,
                      })),
                    ]}
                    disabled={!categoryFilter}
                  />
                </div>

                {/* Add Product Button */}
                <div className="sm:col-span-2 flex justify-end">
                  <Button onClick={() => setShowAddProduct(true)} className="w-full sm:w-auto">
                    + Add Product
                  </Button>
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
                <span className="text-xs font-semibold text-stone-500 mr-1">Status:</span>
                <button
                  type="button"
                  onClick={() => setStockStatusFilter("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    stockStatusFilter === "all"
                      ? "bg-summit-600 text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStockStatusFilter("in_stock")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    stockStatusFilter === "in_stock"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  In Stock ({inStockCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStockStatusFilter("low_stock")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    stockStatusFilter === "low_stock"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  Low Stock ({lowStockCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStockStatusFilter("out_of_stock")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    stockStatusFilter === "out_of_stock"
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                  }`}
                >
                  Out of Stock ({outOfStockCount})
                </button>

                {(searchFilter || categoryFilter || subcategoryFilter || stockStatusFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFilter("");
                      setCategoryFilter("");
                      setSubcategoryFilter("");
                      setStockStatusFilter("all");
                    }}
                    className="ml-auto text-xs text-summit-700 hover:text-summit-800 font-medium underline"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            <ProductTable
              products={products}
              categoryFilter={categoryFilter}
              subcategoryFilter={subcategoryFilter}
              searchFilter={searchFilter}
              stockStatusFilter={stockStatusFilter}
              onEdit={setEditProduct}
              onDuplicate={setDuplicateProduct}
              onRestock={setRestockProduct}
              onDelete={handleDelete}
              onQuickStockChange={handleQuickStockChange}
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
        isOpen={!!duplicateProduct}
        onClose={() => setDuplicateProduct(null)}
        title="Duplicate Product"
        wide
      >
        {duplicateProduct && (
          <ProductForm
            initialData={duplicateProduct}
            onSubmit={handleDuplicateProduct}
            onCancel={() => setDuplicateProduct(null)}
            submitLabel="Save Duplicate"
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