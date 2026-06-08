/**
 * /api/inventory
 * GET — all catalogue products
 * POST — add product (body: product fields)
 * PUT — update product (body: { id, ...updates })
 * DELETE — remove product (?id=uuid)
 * Response: { success, data?, error? }
 */

import { NextRequest } from "next/server";
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
} from "@/lib/inventoryService";
import { jsonResponse } from "@/lib/apiResponse";
import type { Product } from "@/types";

export async function GET() {
  try {
    const products = await getAllProducts();
    return jsonResponse(true, products);
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = await addProduct({
      name: body.name,
      category: body.category,
      subcategory: body.subcategory,
      variant: body.variant,
      sellingPrice: Number(body.sellingPrice),
      stockQuantity: Number(body.stockQuantity),
      lowStockThreshold: Number(body.lowStockThreshold ?? 5),
    });
    return jsonResponse(true, product, undefined, 201);
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, quantityToAdd, ...updates } = body;
    if (!id) return jsonResponse(false, undefined, "id is required");

    if (action === "restock") {
      const product = await restockProduct(id, Number(quantityToAdd));
      if (!product) return jsonResponse(false, undefined, "Product not found", 404);
      return jsonResponse(true, product);
    }

    const product = await updateProduct(id, updates as Partial<Product>);
    if (!product) return jsonResponse(false, undefined, "Product not found", 404);
    return jsonResponse(true, product);
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return jsonResponse(false, undefined, "id is required");
    const ok = await deleteProduct(id);
    if (!ok) return jsonResponse(false, undefined, "Product not found", 404);
    return jsonResponse(true, { deleted: true });
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}
