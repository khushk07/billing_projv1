/**
 * /api/sales
 * GET — all sales (newest first)
 * POST — complete a new sale
 * Response: { success, data?, error? }
 */

import { NextRequest } from "next/server";
import { getAllSales, completeSale } from "@/lib/salesService";
import { jsonResponse } from "@/lib/apiResponse";
import type { CompleteSalePayload } from "@/types";

export async function GET() {
  try {
    const sales = await getAllSales();
    return jsonResponse(true, sales);
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompleteSalePayload;
    const sale = await completeSale(body);
    return jsonResponse(true, sale, undefined, 201);
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 400);
  }
}
