/**
 * /api/stocklog
 * GET — active stock log entries (?all=true for including promoted)
 * POST — add entry or bulk import
 * PUT — promote entry (body: { id, action: 'promote' })
 * Response: { success, data?, error? }
 */

import { NextRequest } from "next/server";
import {
  getActiveStockLog,
  getAllStockLog,
  addStockLogEntry,
  bulkImportStockLog,
  promoteStockLogEntry,
} from "@/lib/stocklogService";
import { jsonResponse } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get("all") === "true";
    const data = all ? await getAllStockLog() : await getActiveStockLog();
    return jsonResponse(true, data);
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "bulk-import") {
      const lines = body.lines as {
        name: string;
        approxPrice: number;
        quantity: number;
      }[];
      const created = await bulkImportStockLog(
        lines,
        body.defaultCategory ?? "Rainwear",
        body.defaultSubcategory ?? "Ponchos"
      );
      return jsonResponse(true, created, undefined, 201);
    }

    const entry = await addStockLogEntry({
      name: body.name,
      category: body.category,
      subcategory: body.subcategory,
      approxPrice: Number(body.approxPrice),
      quantity: Number(body.quantity),
      source: body.source ?? "manual",
      hsnCode: body.hsnCode || undefined,
      gstPercentage: body.gstPercentage !== undefined ? Number(body.gstPercentage) : undefined,
    });
    return jsonResponse(true, entry, undefined, 201);
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === "promote" && body.id) {
      const entry = await promoteStockLogEntry(body.id);
      if (!entry) return jsonResponse(false, undefined, "Entry not found", 404);
      return jsonResponse(true, entry);
    }
    return jsonResponse(false, undefined, "Invalid action");
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}
