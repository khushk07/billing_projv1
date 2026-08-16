/**
 * /api/dashboard
 * GET — aggregated dashboard stats
 * Response: { success, data: DashboardStats, error? }
 */

import { getDashboardStats } from "@/lib/dashboardService";
import { jsonResponse } from "@/lib/apiResponse";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return jsonResponse(true, stats);
  } catch (e) {
    return jsonResponse(false, undefined, (e as Error).message, 500);
  }
}
