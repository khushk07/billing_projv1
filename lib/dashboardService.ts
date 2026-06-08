import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import { getAllSales } from "@/lib/salesService";
import { getLowStockProducts } from "@/lib/inventoryService";
import type { DashboardStats } from "@/types";

/**
 * Aggregates dashboard statistics.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const sales = await getAllSales();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const todaySales = sales.filter((s) =>
    isWithinInterval(new Date(s.createdAt), {
      start: todayStart,
      end: todayEnd,
    })
  );

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
  const billsToday = todaySales.length;

  const weekSales = sales.filter((s) =>
    isWithinInterval(new Date(s.createdAt), {
      start: weekStart,
      end: weekEnd,
    })
  );

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

  const lowStockProducts = await getLowStockProducts();
  const recentSales = sales.slice(0, 10);

  return {
    todayRevenue,
    billsToday,
    lowStockProducts,
    topSubcategoryThisWeek,
    recentSales,
  };
}
