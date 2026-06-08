/**
 * /api/stocklog/quick
 * POST — add quick item from billing (source: billing)
 * Response: { success, data: StockLogItem, error? }
 */

import { NextRequest } from "next/server";
import { addStockLogEntry } from "@/lib/stocklogService";
import { jsonResponse } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = await addStockLogEntry({
      name: body.name,
      category: body.category,
      subcategory: body.subcategory,
      approxPrice: Number(body.approxPrice ?? body.price),
      quantity: Number(body.quantity ?? 0),
      source: "billing",
      lastUsedPrice: Number(body.price),
    });
    return jsonResponse(true, entry, undefined, 201);
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}
