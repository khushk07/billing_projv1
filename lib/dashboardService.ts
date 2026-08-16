import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import { getSalesInDateRange, getRecentSales } from "@/lib/salesService";
import { getLowStockProducts } from "@/lib/inventoryService";
import type { DashboardStats } from "@/types";

/**
 * Aggregates dashboard statistics.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Fetch only sales for this week (which contains today), top recent sales, and low stock products in parallel
  const [weekSales, recentSales, lowStockProducts] = await Promise.all([
    getSalesInDateRange(weekStart, weekEnd),
    getRecentSales(10),
    getLowStockProducts(),
  ]);

  const todaySales = weekSales.filter((s) =>
    isWithinInterval(new Date(s.createdAt), {
      start: todayStart,
      end: todayEnd,
    })
  );

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
  const billsToday = todaySales.length;

  const subcategoryCounts: Record<string, number> = {};
  for (const sale of weekSales) {
    for (const item of sale.items) {
      subcategoryCounts[item.subcategory] =
        (subcategoryCounts[item.subcategory] ?? 0) + item.quantity;
    }
  }

  let topSubcategoryThisWeek: { subcategory: string; count: number } | null =
    null;
  for (const [subcategory, count] of Object.entries(subcategoryCounts)) {
    if (!topSubcategoryThisWeek || count > topSubcategoryThisWeek.count) {
      topSubcategoryThisWeek = { subcategory, count };
    }
  }

  return {
    todayRevenue,
    billsToday,
    lowStockProducts,
    topSubcategoryThisWeek,
    recentSales,
  };
}
