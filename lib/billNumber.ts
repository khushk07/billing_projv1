import type { Sale } from "@/types";

/**
 * Generates the next bill number in SG-0001 format from existing sales.
 * @param sales - All completed sales
 * @returns Next bill number string e.g. SG-0043
 */
export function getNextBillNumber(sales: Sale[]): string {
  let maxNum = 0;
  for (const sale of sales) {
    const match = sale.billNumber.match(/^SG-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const next = maxNum + 1;
  return `SG-${String(next).padStart(4, "0")}`;
}
