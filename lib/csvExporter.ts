/**
 * Escapes a CSV field value.
 * @param value - Raw field value
 * @returns Escaped string safe for CSV
 */
function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

import { format } from "date-fns";
import { getAutoHsn } from "@/lib/categories";
import type { Sale } from "@/types";

/**
 * Triggers a browser download of a JSON object.
 */
export function downloadJson(filename: string, data: unknown): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Builds CSV content from headers and rows, triggers browser download.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const lines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export interface TaxSummaryRow {
  date: string; // "dd/MM/yyyy"
  rawDate: string;
  billNumber: string;
  description: string;
  quantity: number;
  pricePerPc: number;
  hsn: string;
  gstPercentage: number;
  totalValue: number;
  baseValue: number;
  tax: number;
}

/**
 * Transforms a list of sales into individual item tax summary rows matching tax reporting format.
 */
export function generateTaxSummaryRows(sales: Sale[]): TaxSummaryRow[] {
  const rows: TaxSummaryRow[] = [];

  // Sort sales chronologically (earliest first)
  const sorted = [...sales].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const sale of sorted) {
    const dateFormatted = format(new Date(sale.createdAt), "dd/MM/yyyy");
    for (const item of sale.items) {
      const gst = item.gstPercentage !== undefined && item.gstPercentage !== null ? item.gstPercentage : 5;
      const totalVal = Number((item.quantity * item.unitPrice).toFixed(2));
      const baseVal = Number((totalVal / (1 + (gst / 100))).toFixed(2));
      const taxVal = Number((totalVal - baseVal).toFixed(2));
      const autoHsn = getAutoHsn(item.category || "Hiking Gears", item.subcategory || "", item.unitPrice);
      const hsn = item.hsnCode || autoHsn || "-";

      rows.push({
        date: dateFormatted,
        rawDate: sale.createdAt,
        billNumber: sale.billNumber,
        description: item.name || item.subcategory || "Goods",
        quantity: item.quantity,
        pricePerPc: item.unitPrice,
        hsn,
        gstPercentage: gst,
        totalValue: totalVal,
        baseValue: baseVal,
        tax: taxVal,
      });
    }
  }

  return rows;
}

/**
 * Exports all sold items formatted as a Tax Summary CSV matching standard accounting columns.
 */
export function downloadTaxSummaryCsv(sales: Sale[], customFilename?: string): void {
  const rows = generateTaxSummaryRows(sales);
  const dateStr = format(new Date(), "yyyy-MM-dd");
  const filename = customFilename || `summit-gear-tax-summary-${dateStr}.csv`;

  const headers = [
    "Date",
    "Description of Goods",
    "Quantity",
    "Price per pc",
    "HSN",
    "GST %",
    "Total Value inclusive of tax",
    "Base Value",
    "Tax",
  ];

  const csvRows = rows.map((r) => [
    r.date,
    r.description,
    r.quantity,
    r.pricePerPc,
    r.hsn,
    `${r.gstPercentage}%`,
    r.totalValue.toFixed(1),
    r.baseValue.toFixed(1),
    r.tax.toFixed(1),
  ]);

  downloadCsv(filename, headers, csvRows);
}
